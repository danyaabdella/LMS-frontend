'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, BookOpen, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function StudentDashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Student Dashboard</h1>
              <p className="text-slate-400">Welcome back, {session?.user?.name}</p>
            </div>
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Demo Video Card */}
          <Link href="/security/video-protection">
            <Card className="border-slate-700 bg-slate-800/50 hover:border-blue-500/50 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Play className="w-6 h-6 text-blue-400" />
                  <CardTitle>Demo Video</CardTitle>
                </div>
                <CardDescription>Watch the instructional video</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-700/50 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-blue-400 mx-auto mb-2" />
                    <p className="text-slate-400">Video Player</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Demo video content will be displayed here
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  This is a demo video showcasing the platform features and how to use the quiz system.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Quiz Card */}
          <Card className="border-slate-700 bg-slate-800/50 hover:border-blue-500/50 transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-400" />
                <CardTitle>Take Quiz</CardTitle>
              </div>
              <CardDescription>Test your knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-6">
                Access and take online quizzes with an interactive interface. Answer multiple-choice questions and get instant feedback.
              </p>
              <Link href="/student/quiz">
                <Button className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


