'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export const Hero: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI-Powered <span className="text-blue-600">Investment<br />Research</span> Assistant
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Make smarter investment decisions with our conversation-driven research tool that delivers personalized investment reports based on your preferences and real-time market data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                Start Researching <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-gray-600">
            <div className="flex items-center gap-2"><span className="text-green-500">✔</span> Personalized investment reports</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✔</span> Real-time market data</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✔</span> AI-powered analysis</div>
          </div>
        </div>
      </div>
    </section>
  )
} 