import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../ui/Header'
import { PageContainer } from '../ui/PageContainer'

export function AppLayout({ session }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0D0F14] text-[#F4F4F5]">
      {/* App Shell Header */}
      <Header session={session} />

      {/* Main Page Viewport Container */}
      <main className="flex-1 py-8 sm:py-12">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>

      {/* Subtle Minimal Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0D0F14] py-8 mt-16 text-xs text-[#71717A]">
        <PageContainer>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} LynqArt. Digital artwork archives &amp; permanent QR statements.</p>
            <p className="text-[#A1A1AA]">Digital Archive + Contemporary Art Gallery</p>
          </div>
        </PageContainer>
      </footer>
    </div>
  )
}
