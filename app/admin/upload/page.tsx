'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Trash2, Eye, Edit2, ArrowLeft, Loader2, BarChart3, LogOut } from 'lucide-react'
import { examApi, quizApi, type Exam, type Question } from '@/lib/api'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'

export default function AdminUploadPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedExamQuestions, setSelectedExamQuestions] = useState<Question[]>([])
  const pathname = usePathname()
  const { data: session } = useSession()

  // Fetch exams on mount
  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      setLoading(true)
      const data = await examApi.getAll()
      setExams(data)
    } catch (error) {
      toast.error('Failed to load exams')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadExamQuestions = async (examId: number) => {
    try {
      const questions = await quizApi.getQuestions(examId)
      setSelectedExamQuestions(questions)
    } catch (error) {
      toast.error('Failed to load questions')
      console.error(error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/pdf',
      'text/plain'
    ]
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload .docx, .pdf, or .txt files.')
      return
    }

    try {
      setUploading(true)
      const examName = file.name.split('.')[0]
      const userId = session?.user?.id ? parseInt(session.user.id) : 1
      
      if (!session?.user) {
        toast.error('You must be logged in to upload exams')
        return
      }
      
      const result = await examApi.upload(file, examName, userId)
      toast.success(`Exam uploaded successfully! ${result.questionCount} questions processed.`)
      await loadExams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload exam')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleViewExam = async (exam: Exam) => {
    setSelectedExam(exam)
    await loadExamQuestions(exam.id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* SIDEBAR */}
      <div className="w-64 border-r border-slate-700 bg-slate-900/50 backdrop-blur-md flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-blue-400">Admin Panel</h2>
          {session && (
            <p className="text-sm text-slate-400 mt-1">{session.user.name}</p>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/analytics">
            <Button
              variant={pathname === '/admin/analytics' ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/admin/upload">
            <Button
              variant={pathname === '/admin/upload' ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Exam Generator</h1>
              <p className="text-slate-400">Upload MCQ files to create online exams</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedExam ? (
          <>
            {/* Upload Section */}
            <Card className="border-slate-700 bg-slate-800/50 mb-8">
              <CardHeader>
                <CardTitle>Upload Exam File</CardTitle>
                <CardDescription>
                  Supported formats: .docx, .pdf, .txt (with MCQ format)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragging
                      ? 'border-blue-400 bg-blue-400/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-semibold mb-2">Drag and drop your file here</p>
                  <p className="text-slate-400 mb-4">or</p>
                  <Input
                    type="file"
                    accept=".docx,.pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input">
                    <Button asChild variant="default" disabled={uploading}>
                      <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Exams List */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle>Uploaded Exams</CardTitle>
                <CardDescription>{exams.length} exam(s) available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-700/20">
                        <TableHead>Exam Name</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : exams.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                            No exams uploaded yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        exams.map((exam) => (
                          <TableRow key={exam.id} className="border-slate-700 hover:bg-slate-700/20">
                            <TableCell className="font-medium">{exam.name}</TableCell>
                            <TableCell className="text-slate-400">{exam.fileName}</TableCell>
                            <TableCell>{exam.questionCount}</TableCell>
                            <TableCell className="text-slate-400">
                              {new Date(exam.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  exam.status === 'published'
                                    ? 'default'
                                    : exam.status === 'processing'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {exam.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewExam(exam)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Question Preview */}
            <Button
              variant="ghost"
              onClick={() => setSelectedExam(null)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>

            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle>{selectedExam.name}</CardTitle>
                <CardDescription>
                  {selectedExam.questionCount} questions • {selectedExam.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedExamQuestions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading questions...
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedExamQuestions.map((question, i) => (
                      <Card key={question.id} className="border-slate-600 bg-slate-700/30">
                        <CardContent className="pt-6">
                          <p className="font-semibold mb-4">
                            Question {question.questionNumber}: {question.questionText}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option, idx) => (
                              <div key={option.id} className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`q${question.id}`}
                                  id={`q${question.id}-${idx}`}
                                  disabled
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`q${question.id}-${idx}`} className="flex-1">
                                  {option.text}
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
