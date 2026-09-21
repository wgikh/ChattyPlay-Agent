import React, { useEffect, useCallback } from 'react'
import styled from 'styled-components'

// 社会主义核心价值观词语
const WORDS = [
  '富强',
  '民主',
  '文明',
  '和谐',
  '自由',
  '平等',
  '公正',
  '法治',
  '爱国',
  '敬业',
  '诚信',
  '友善'
]

// 浮动文字样式
const FloatingText = styled.b<{ x: number; y: number; color: string }>`
  position: fixed;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  font-size: 16px;
  cursor: default;
  color: ${props => props.color};
  transform: translate3d(0, 0, 0) scale(1.2);
  pointer-events: none;
  user-select: none;
  animation: click-word 1s ease-out forwards;
  z-index: 9999;
  font-weight: 500;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);

  @keyframes click-word {
    to {
      opacity: 0;
      transform: translate3d(0, -62px, 0) scale(1.32);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`

interface WordInstance {
  id: number
  text: string
  x: number
  y: number
  color: string
}

// 生成随机颜色
const randomColor = (): string => {
  const r = Math.floor(Math.random() * 255)
  const g = Math.floor(Math.random() * 255)
  const b = Math.floor(Math.random() * 255)
  return `rgb(${r}, ${g}, ${b})`
}

const ClickEffect: React.FC = () => {
  const [words, setWords] = React.useState<WordInstance[]>([])
  const wordIndexRef = React.useRef(0)

  // 处理点击事件
  const handleClick = useCallback((event: MouseEvent) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select, summary, label')) return

    const fontSize = 16
    const x = event.clientX - fontSize / 2
    const y = event.clientY - fontSize

    const newWord: WordInstance = {
      id: Date.now() + Math.random(),
      text: WORDS[wordIndexRef.current],
      x,
      y,
      color: randomColor()
    }

    // 更新词语索引
    wordIndexRef.current = (wordIndexRef.current + 1) % WORDS.length

    setWords(prev => [...prev, newWord])
  }, [])

  // 添加全局点击事件监听
  useEffect(() => {
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('click', handleClick)
    }
  }, [handleClick])

  return (
    <>
      {words.map(word => (
        <FloatingText
          key={word.id}
          x={word.x}
          y={word.y}
          color={word.color}
          onAnimationEnd={() => setWords(current => current.filter(item => item.id !== word.id))}
        >
          {word.text}
        </FloatingText>
      ))}
    </>
  )
}

export default ClickEffect
