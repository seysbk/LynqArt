import os
import urllib.request
import json
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsArtistOrReadOnly
from artworks.models import Artwork

from .models import AIGeneration
from .serializers import AIGenerationSerializer


def synthesize_artist_statement(title, medium, concept, tone='contemplative'):
    """
    Structured artistic statement generator fallback when OpenAI API key is not configured.
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
        prompt = request.data.get('prompt', '')
        tone = request.data.get('tone', 'contemplative')
        mode = request.data.get('mode', 'statement')

        if not artwork_id:
            return Response({'error': 'Artwork ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            artwork = Artwork.objects.get(id=artwork_id)
        except Artwork.DoesNotExist:
            return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)

        api_key = os.environ.get('OPENAI_API_KEY')
        generated_text = ""
        model_used = "gpt-4o-mini"

        if api_key:
            try:
                # Direct HTTP request to OpenAI Chat Completions API
                url = "https://api.openai.com/v1/chat/completions"
                payload = json.dumps({
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a professional contemporary art curator and artist statement writing assistant. Write compelling, well-structured GitHub Flavored Markdown artist statements."
                        },
                        {
                            "role": "user",
                            "content": f"Write an artist statement for artwork '{artwork.title}' ({artwork.medium}). Additional notes: {prompt}. Tone: {tone}."
                        }
                    ],
                    "temperature": 0.7
                }).encode('utf-8')
                
                req = urllib.request.Request(url, data=payload, headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                })
                with urllib.request.urlopen(req) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    generated_text = res_data['choices'][0]['message']['content']
            except Exception:
                generated_text = synthesize_artist_statement(artwork.title, artwork.medium, prompt, tone)
                model_used = "lynqart-ai-assistant"
        else:
            generated_text = synthesize_artist_statement(artwork.title, artwork.medium, prompt, tone)
            model_used = "lynqart-ai-assistant"

        generation = AIGeneration.objects.create(
            artwork=artwork,
            user=request.user,
            prompt=prompt,
            generated_text=generated_text,
            model_used=model_used,
            accepted=False
        )

        serializer = self.get_serializer(generation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
