'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { examApi, quizApi, type Exam, type Question } from '@/lib/api'
import { toast } from 'sonner'

interface QuizState {
  stage: 'list' | 'taking' | 'review'
  selectedExam: Exam | null
  questions: Question[]
  reviewQuestions: Question[]
  answers: Record<string, number> // questionId -> selectedOptionId
  currentQuestion: number
  startTime: number | null
  submittedResult: {
    score: number
    correct: number
    total: number
  } | null
}

export default function StudentQuizPage() {
  const { data: session } = useSession()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const [quizState, setQuizState] = useState<QuizState>({
    stage: 'list',
    selectedExam: null,
    questions: [],
    reviewQuestions: [],
    answers: {},
    currentQuestion: 0,
    startTime: null,
    submittedResult: null,
  })

  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    loadExams()
  }, [])

  useEffect(() => {
    if (quizState.stage === 'taking' && quizState.startTime) {
      // Start timer (assuming 60 minutes default, or calculate from exam)
      const duration = 60 * 60 // 60 minutes in seconds
      setTimeLeft(duration)

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState.stage, quizState.startTime])

  const loadExams = async () => {
    try {
      setLoading(true)
      const data = await examApi.getAll()
      // Only show published exams
      const publishedExams = data.filter(exam => exam.status === 'published')
      setExams(publishedExams)
    } catch (error) {
      toast.error('Failed to load exams')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = async (exam: Exam) => {
    try {
      setQuestionsLoading(true)
      const questions = await quizApi.getQuestions(exam.id)
      
      setQuizState({
        stage: 'taking',
        selectedExam: exam,
        questions,
        reviewQuestions: [],
        answers: {},
        currentQuestion: 0,
        startTime: Date.now(),
        submittedResult: null,
      })
    } catch (error) {
      toast.error('Failed to load questions')
      console.error(error)
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleSelectAnswer = (questionId: number, optionId: number) => {
    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: optionId
      }
    }))
  }

  const handleNextQuestion = () => {
    if (quizState.currentQuestion < quizState.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }))
    }
  }

  const handleSubmitQuiz = async () => {
    if (!quizState.selectedExam || !session?.user?.id) {
      toast.error('Missing exam or user information')
      return
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    try {
      setSubmitting(true)
      const durationSeconds = quizState.startTime 
        ? Math.floor((Date.now() - quizState.startTime) / 1000)
        : 0

      const result = await quizApi.submit({
        examId: quizState.selectedExam.id,
        studentId: parseInt(session.user.id),
        answers: quizState.answers,
        durationSeconds,
      })

      let reviewQuestions: Question[] = []
      try {
        reviewQuestions = await quizApi.getQuestions(quizState.selectedExam.id, {
          includeCorrect: true,
        })
      } catch (err) {
        console.error('Failed to load review questions', err)
      }

      setQuizState(prev => ({
        ...prev,
        stage: 'review',
        submittedResult: result,
        reviewQuestions,
      }))

      toast.success(`Quiz submitted! Score: ${result.score}%`)
    } catch (error) {
      toast.error('Failed to submit quiz')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-blue-400">Student Quiz Portal</h1>
                <p className="text-slate-400">Take exams and assess your knowledge</p>
              </div>
            </div>
            {quizState.stage === 'taking' && (
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-semibold">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {quizState.stage === 'list' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Available Exams</h2>
              <p className="text-slate-400">Select an exam to begin</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : exams.length === 0 ? (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-slate-400">No exams available yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map(exam => (
                  <Card key={exam.id} className="border-slate-700 bg-slate-800/50 hover:border-blue-500/50 transition-all">
                    <CardHeader>
                      <CardTitle>{exam.name}</CardTitle>
                      <CardDescription>{exam.questionCount} questions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Status:</span>
                          <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                            {exam.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Created:</span>
                          <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleStartQuiz(exam)}
                        disabled={questionsLoading}
                      >
                        {questionsLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Start Exam'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {quizState.stage === 'taking' && quizState.questions.length > 0 && (
          <>
            {/* Question Navigation */}
            <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
              {quizState.questions.map((q, idx) => (
                <Button
                  key={q.id}
                  variant={
                    quizState.currentQuestion === idx
                      ? 'default'
                      : quizState.answers[q.id] !== undefined
                        ? 'secondary'
                        : 'outline'
                  }
                  size="sm"
                  onClick={() => setQuizState(prev => ({ ...prev, currentQuestion: idx }))}
                  className="shrink-0"
                >
                  {idx + 1}
                </Button>
              ))}
            </div>

            {/* Question Card */}
            <Card className="border-slate-700 bg-slate-800/50 mb-8">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      Question {quizState.currentQuestion + 1} of {quizState.questions.length}
                    </CardTitle>
                    <CardDescription>
                      {quizState.questions[quizState.currentQuestion].difficulty} difficulty
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <p className="text-lg font-semibold mb-6">
                    {quizState.questions[quizState.currentQuestion].questionText}
                  </p>

                  <div className="space-y-3">
                    {quizState.questions[quizState.currentQuestion].options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center p-4 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/30 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${quizState.questions[quizState.currentQuestion].id}`}
                          checked={
                            quizState.answers[quizState.questions[quizState.currentQuestion].id] === option.id
                          }
                          onChange={() =>
                            handleSelectAnswer(
                              quizState.questions[quizState.currentQuestion].id,
                              option.id
                            )
                          }
                          className="w-4 h-4"
                        />
                        <span className="ml-3 flex-1">{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 justify-between">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setQuizState(prev => ({
                        ...prev,
                        currentQuestion: Math.max(0, prev.currentQuestion - 1)
                      }))
                    }
                    disabled={quizState.currentQuestion === 0}
                  >
                    Previous
                  </Button>

                  {quizState.currentQuestion === quizState.questions.length - 1 ? (
                    <Button 
                      onClick={handleSubmitQuiz} 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Quiz'
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion}>Next</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {quizState.stage === 'review' && quizState.submittedResult && (
          <>
            <Card className="border-slate-700 bg-slate-800/50 mb-8">
              <CardHeader>
                <CardTitle>Exam Completed!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-6xl font-bold text-blue-400 mb-4">
                    {quizState.submittedResult.score}%
                  </div>
                  <p className="text-xl text-slate-400 mb-8">
                    You answered {quizState.submittedResult.correct} of{' '}
                    {quizState.submittedResult.total} questions correctly
                  </p>
                  <Button
                    onClick={() => {
                      setQuizState({
                        stage: 'list',
                        selectedExam: null,
                        questions: [],
                        reviewQuestions: [],
                        answers: {},
                        currentQuestion: 0,
                        startTime: null,
                        submittedResult: null,
                      })
                      setTimeLeft(0)
                    }}
                  >
                    Back to Exams
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Answer Review */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle>Your Answers</CardTitle>
                <CardDescription>Review your submitted answers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(quizState.reviewQuestions.length ? quizState.reviewQuestions : quizState.questions).map((question) => {
                    const selectedOptionId = quizState.answers[question.id]
                    const selectedOption = question.options.find(opt => opt.id === selectedOptionId)
                    const correctOption = question.options.find(opt => opt.isCorrect)
                    const isCorrectAnswer = question.options.some(
                      opt => opt.id === selectedOptionId && opt.isCorrect
                    )

                    return (
                      <Card key={question.id} className="border-slate-600 bg-slate-700/30">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="flex-1">
                              <p className="font-semibold mb-3">
                                Question {question.questionNumber}: {question.questionText}
                              </p>
                              <div className="flex items-center mb-4">
                                {isCorrectAnswer ? (
                                  <span className="flex items-center text-green-400 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Correct
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-400 text-sm">
                                    <XCircle className="w-4 h-4 mr-2" /> Incorrect
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2">
                                {question.options.map((option) => {
                                  const isSelected = option.id === selectedOptionId
                                  const isCorrect = option.isCorrect
                                  return (
                                    <div
                                      key={option.id}
                                      className={`p-2 rounded border ${
                                        isCorrect
                                          ? 'border-green-500/60 bg-green-500/10'
                                          : isSelected
                                            ? 'border-red-500/60 bg-red-500/10'
                                            : 'border-slate-600'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        checked={isSelected}
                                        disabled
                                        className="mr-2"
                                      />
                                      {option.text}
                                      {isCorrect && (
                                        <span className="ml-2 text-xs text-green-400">(Correct)</span>
                                      )}
                                      {isSelected && !isCorrect && (
                                        <span className="ml-2 text-xs text-red-400">(Your choice)</span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              {question.answerExplanation && (
                                <div className="mt-4 text-sm text-slate-300 bg-slate-800/60 p-3 rounded border border-slate-600">
                                  <p className="font-semibold text-slate-100 mb-1">Explanation</p>
                                  <p>{question.answerExplanation}</p>
                                </div>
                              )}
                              {!question.answerExplanation && correctOption && (
                                <p className="mt-4 text-sm text-slate-400">
                                  Correct answer:{' '}
                                  <span className="text-slate-100">{correctOption.text}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
