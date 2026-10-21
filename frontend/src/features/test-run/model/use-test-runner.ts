import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { request } from '../../../shared/api'
import { getTestById } from '../../../entities/test'
import type { Question } from '../../../entities/question'

interface SubmitResponse {
  score: number
  total: number
  details: Record<string, unknown>
}

export function useTestRunner() {
  const { id: testId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [group, setGroup] = useState('')

  const [timeLeft, setTimeLeft] = useState(600)

  const totalTestTimeRef = useRef(600)
  const timeLeftRef = useRef(600)
  const tabSwitchesRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSubmittingRef = useRef(false)
  const finishedRef = useRef(false)
  const startedRef = useRef(false)
  const handleSubmitRef = useRef<() => void>(() => {})

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }, [timeLeft])

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (timeLeftRef.current > 1) {
        timeLeftRef.current -= 1
        setTimeLeft(timeLeftRef.current)
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        alert('Время вышло! Тест будет автоматически отправлен.')
        handleSubmitRef.current()
      }
    }, 1000)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !group.trim()) {
      alert('Пожалуйста, заполните ФИО и группу перед отправкой')
      return
    }

    if (isSubmittingRef.current) {
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    try {
      const data = await request<SubmitResponse>('/results', {
        method: 'POST',
        body: {
          testId: Number(testId),
          name: name.trim(),
          group: group.trim(),
          answers,
          timeSpent: totalTestTimeRef.current - timeLeftRef.current,
          tabSwitches: tabSwitchesRef.current,
        },
      })

      localStorage.setItem(
        'lastResult',
        JSON.stringify({
          score: data.score,
          total: data.total,
          details: data.details,
        }),
      )

      finishedRef.current = true

      navigate('/results')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Неизвестная ошибка'

      alert('Ошибка при отправке: ' + message)

      isSubmittingRef.current = false
      setIsSubmitting(false)
      startTimer()
    }
  }

  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  })

  // Загрузка теста + слушатели
  useEffect(() => {
    let cancelled = false

    const handleVisibility = () => {
      if (document.hidden && !finishedRef.current && startedRef.current) {
        tabSwitchesRef.current += 1
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!finishedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleBeforeUnload)

    const loadTest = async () => {
      if (!testId) {
        setLoading(false)
        return
      }

      try {
        const data = await getTestById(testId)

        if (cancelled) return

        const qs: Question[] = data.questions.map((q) => ({
          ...q,
          id: Number(q.id),
        }))

        setQuestions(qs)

        if (data.time_limit) {
          totalTestTimeRef.current = Number(data.time_limit)
          timeLeftRef.current = Number(data.time_limit)
          setTimeLeft(Number(data.time_limit))
        }

        const initialAnswers: Record<number, string> = {}

        qs.forEach((q) => {
          initialAnswers[q.id] = ''
        })

        setAnswers(initialAnswers)
        startedRef.current = true
      } catch (e) {
        console.error('Ошибка загрузки теста:', e)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTest()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [testId])

  // Запуск таймера после загрузки вопросов
  useEffect(() => {
    if (!loading && questions.length > 0) {
      startTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, questions.length])

  // Блокировка ухода с теста
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !finishedRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const answer = window.confirm(
        'Вы уверены, что хотите покинуть тест? Ваши ответы не будут сохранены!',
      )

      if (answer) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  const handleSelect = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  return {
    questions,
    answers,
    loading,
    isSubmitting,
    name,
    group,
    timeLeft,
    formattedTime,
    setName,
    setGroup,
    handleSelect,
    handleSubmit,
  }
}
