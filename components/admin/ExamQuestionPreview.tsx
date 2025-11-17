'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Edit2, Trash2, Check, X } from 'lucide-react'
import { quizApi, type Exam, type Question } from '@/lib/api'

interface ExamQuestionPreviewProps {
  exam: Exam
  onBack: () => void
  onQuestionCountChange?: (delta: number) => void
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export function ExamQuestionPreview({ exam, onBack, onQuestionCountChange }: ExamQuestionPreviewProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
  const [formState, setFormState] = useState<{
    questionText: string
    answerExplanation: string
    difficulty: Question['difficulty']
    options: Array<{ id: number; text: string; isCorrect: boolean }>
  } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await quizApi.getQuestions(exam.id, { includeCorrect: true })
      setQuestions(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [exam.id])

  const startEditing = (question: Question) => {
    setEditingQuestionId(question.id)
    setFormState({
      questionText: question.questionText,
      answerExplanation: question.answerExplanation || '',
      difficulty: question.difficulty,
      options: question.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: !!opt.isCorrect,
      })),
    })
  }

  const cancelEditing = () => {
    setEditingQuestionId(null)
    setFormState(null)
  }

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Delete this question? This action cannot be undone.')) return
    try {
      await quizApi.deleteQuestion(questionId)
      toast.success('Question deleted')
      loadQuestions()
      onQuestionCountChange?.(-1)
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete question')
    }
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestionId || !formState) return
    try {
      setSaving(true)
      await quizApi.updateQuestion(editingQuestionId, {
        questionText: formState.questionText,
        difficulty: formState.difficulty,
        answerExplanation: formState.answerExplanation,
        options: formState.options,
      })
      toast.success('Question updated')
      cancelEditing()
      loadQuestions()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to update question')
    } finally {
      setSaving(false)
    }
  }

  const updateOption = (index: number, updates: Partial<{ text: string; isCorrect: boolean }>) => {
    if (!formState) return
    const updated = [...formState.options]
    updated[index] = { ...updated[index], ...updates }
    setFormState({ ...formState, options: updated })
  }

  return (
    <>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </Button>

      <Card className="border-slate-700 bg-slate-800/50 mb-6">
        <CardHeader>
          <CardTitle>{exam.name}</CardTitle>
          <CardDescription>
            {exam.questionCount} questions • {exam.status}
          </CardDescription>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          No questions available for this exam yet.
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map(question => {
            const isEditing = editingQuestionId === question.id
            return (
              <Card key={question.id} className="border-slate-600 bg-slate-700/30">
                <CardContent className="pt-6 space-y-4">
                  {!isEditing ? (
                    <>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold mb-2">
                            Question {question.questionNumber}: {question.questionText}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <Badge variant="outline" className="capitalize">
                              {question.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEditing(question)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                      {question.answerExplanation && (
                        <div className="text-sm text-slate-300">
                          <span className="font-semibold text-slate-100">Explanation:</span>{' '}
                          {question.answerExplanation}
                        </div>
                      )}
                      <div className="space-y-2">
                        {question.options.map(opt => (
                          <div
                            key={opt.id}
                            className={`p-3 rounded border ${
                              opt.isCorrect ? 'border-green-500/60 bg-green-500/10' : 'border-slate-600'
                            }`}
                          >
                            <div className="flex justify-between text-sm">
                              <span>{opt.text}</span>
                              {opt.isCorrect && <span className="text-green-400 font-semibold">Correct</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    formState && (
                      <div className="space-y-4">
                        <div>
                          <Label>Question Text</Label>
                          <Textarea
                            value={formState.questionText}
                            onChange={e =>
                              setFormState({
                                ...formState,
                                questionText: e.target.value,
                              })
                            }
                            className="bg-slate-800 border-slate-600 mt-2"
                          />
                        </div>
                        <div>
                          <Label>Answer Explanation</Label>
                          <Textarea
                            value={formState.answerExplanation}
                            onChange={e =>
                              setFormState({
                                ...formState,
                                answerExplanation: e.target.value,
                              })
                            }
                            className="bg-slate-800 border-slate-600 mt-2"
                            placeholder="Describe why the correct answer is right..."
                          />
                        </div>
                        <div>
                          <Label>Difficulty</Label>
                          <div className="flex gap-2 mt-2">
                            {DIFFICULTIES.map(level => (
                              <Button
                                key={level}
                                type="button"
                                variant={formState.difficulty === level ? 'default' : 'outline'}
                                onClick={() =>
                                  setFormState({
                                    ...formState,
                                    difficulty: level,
                                  })
                                }
                                className="capitalize"
                              >
                                {level}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label>Options</Label>
                          {formState.options.map((opt, index) => (
                            <div
                              key={opt.id}
                              className="p-3 rounded border border-slate-600 space-y-2 bg-slate-800/40"
                            >
                              <Input
                                value={opt.text}
                                onChange={e => updateOption(index, { text: e.target.value })}
                                className="bg-slate-900 border-slate-600"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">
                                  Option {index + 1}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={opt.isCorrect ? 'default' : 'outline'}
                                  onClick={() => updateOption(index, { isCorrect: !opt.isCorrect })}
                                >
                                  {opt.isCorrect ? 'Correct' : 'Mark as Correct'}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleSaveQuestion} disabled={saving}>
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" /> Save
                              </>
                            )}
                          </Button>
                          <Button type="button" variant="outline" onClick={cancelEditing}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

