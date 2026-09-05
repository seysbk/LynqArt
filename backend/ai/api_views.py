import logging
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from artworks.models import Artwork
from exhibitions.models import Exhibition

from .models import AIGeneration
from .serializers import AIGenerationSerializer
from .services import AIProviderError, AIService, AIServiceError

logger = logging.getLogger(__name__)


def synthesize_artist_statement(title, medium, concept, tone='contemplative'):
    """
    Structured artistic statement generator fallback when OpenAI/OpenRouter API key is not configured.
    Generates rich, professional Markdown statements for artists.
    """
    tones = {
        'poetic': 'evokes an introspective resonance',
        'academic': 'interrogates the formal and materiality boundaries',
        'minimalist': 'strips away noise to accentuate essential core form',
        'contemplative': 'invites quiet reflection on memory and perception',
    }
    selected_tone = tones.get(tone.lower(), tones['contemplative'])
    
    title_str = title or 'Untitled Work'
    medium_str = medium or 'mixed media'
    concept_str = concept or 'exploring form, texture, and physical presence'

    statement = (
        f"## Artist Statement: *{title_str}*\n\n"
        f"*{title_str}* is an exploration rendered through {medium_str}. "
        f"At its core, the work engages with {concept_str}, creating a space where physical texture and narrative converge.\n\n"
        f"### Conceptual Foundations\n"
        f"Through this piece, the creative practice {selected_tone}. "
        f"The choice of {medium_str} is intentional—allowing subtle interactions between light, surface, and composition to articulate themes that words often fail to capture fully.\n\n"
        f"> \"The physical artwork acts as an anchor for digital memory—a visual dialogue between presence and preservation.\"\n\n"
        f"### Process & Materials\n"
        f"The construction of *{title_str}* relies on deliberate layering and reduction. "
        f"By balancing structured geometry with intuitive mark-making, the work remains an open dialogue between the artist's intent and the viewer's perception."
    )
    return statement


class AIGenerationViewSet(viewsets.ModelViewSet):
    queryset = AIGeneration.objects.select_related('artwork', 'user').all().order_by('-created_at')
    serializer_class = AIGenerationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('prompt', 'generated_text', 'model_used', 'artwork__title', 'user__username')
    filterset_fields = ('accepted', 'model_used', 'artwork', 'user')
    ordering_fields = ('created_at',)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            return queryset.filter(user=self.request.user)
        return queryset

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def generate_draft(self, request):
        """
        Custom endpoint to generate a draft artist statement or exhibition summary.
        Saves the generation instance for audit and review.
        """
        artwork_id = request.data.get('artwork')
        exhibition_id = request.data.get('exhibition')
        prompt = request.data.get('prompt', '')
        tone = request.data.get('tone', 'contemplative')
        mode = request.data.get('mode', 'statement')

        if bool(artwork_id) == bool(exhibition_id):
            return Response({'error': 'Provide exactly one artwork or exhibition target.'}, status=status.HTTP_400_BAD_REQUEST)

        artwork = None
        exhibition = None
        try:
            if artwork_id:
                artwork = Artwork.objects.get(id=artwork_id)
                if not getattr(request.user, 'is_artist', False):
                    return Response({'error': 'Artist permission is required to generate AI artist statements.'}, status=status.HTTP_403_FORBIDDEN)
                if artwork.artist != request.user:
                    return Response({'error': 'You do not have permission to generate AI statements for this artwork.'}, status=status.HTTP_403_FORBIDDEN)
            else:
                exhibition = Exhibition.objects.get(id=exhibition_id)
                if not getattr(request.user, 'can_manage_exhibitions', False) or exhibition.organizer != request.user:
                    return Response({'error': 'You do not have permission to generate AI summaries for this exhibition.'}, status=status.HTTP_403_FORBIDDEN)
        except (Artwork.DoesNotExist, Exhibition.DoesNotExist, ValueError):
            return Response({'error': 'The selected artwork or exhibition was not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            generated_text, model_used = AIService.generate_statement(
                artwork_title=artwork.title if artwork else exhibition.title,
                artwork_medium=artwork.medium if artwork else '',
                prompt=prompt,
                tone=tone,
                mode=mode,
            )
        except AIProviderError as e:
            target = f'artwork {artwork.id}' if artwork else f'exhibition {exhibition.id}'
            logger.error(f"AI Generation failed for user {request.user.id}, {target}: {e}")
            response_status = e.provider_status if e.provider_status in {401, 402, 429} else status.HTTP_503_SERVICE_UNAVAILABLE
            return Response(
                {
                    'error': str(e),
                    'provider_status': e.provider_status,
                },
                status=response_status,
            )
        except AIServiceError as e:
            target = f'artwork {artwork.id}' if artwork else f'exhibition {exhibition.id}'
            logger.error(f"AI Generation failed for user {request.user.id}, {target}: {e}")
            return Response({'error': str(e), 'provider_status': None}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.exception(f"Unexpected error during AI statement generation: {e}")
            return Response(
                {'error': 'An unexpected error occurred while generating the AI statement.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        generation = AIGeneration.objects.create(
            artwork=artwork,
            exhibition=exhibition,
            user=request.user,
            prompt=prompt,
            generated_text=generated_text,
            model_used=model_used,
            accepted=False
        )

        serializer = self.get_serializer(generation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
