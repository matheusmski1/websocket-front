'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket as ClientSocket } from 'socket.io-client'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

type Message = {
  userId: string
  text: string
  type: 'user' | 'system'
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [userId, setUserId] = useState<string | undefined>('')
  const socketRef = useRef<ClientSocket | null>(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:3002')  

    socketRef.current.on('connect', () => {
      setUserId(socketRef.current?.id)
      setMessages(prevMessages => [
        ...prevMessages,
        {
          userId: 'system',
          text: `Client ${socketRef.current?.id} connected.`,
          type: 'system'
        }
      ])
    })

    socketRef.current.on('user-joined', (payload: { message: string }) => {
      setMessages(prevMessages => [
        ...prevMessages,
        { userId: 'system', text: payload.message, type: 'system' }
      ])
      toast.info(payload.message)
    })

    socketRef.current.on('reply', (message: string) => {
      setMessages(prevMessages => [
        ...prevMessages,
        { userId: 'system', text: message, type: 'system' }
      ])
    })

    socketRef.current.on('user-disconnected', (message: string) => {
      setMessages(prevMessages => [
        ...prevMessages,
        { userId: 'system', text: message, type: 'system' }
      ])
      toast.info(message)
    })

    socketRef.current.on('message', (message: Message) => {
      setMessages(prevMessages => [...prevMessages, message])
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const sendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && socketRef.current && userId) {
      const newMessage: Message = {
        userId: userId,
        text: inputMessage,
        type: 'user',
      }
      socketRef.current.emit('newMessage', newMessage)
      setInputMessage('')
    }
  }, [inputMessage, userId])

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enhanced Chat</h1>
      <div className="flex-grow overflow-y-auto mb-4 p-4 border rounded-lg">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`mb-2 ${
              msg.type === 'system' 
                ? 'text-green-600 font-semibold italic' 
                : msg.userId === userId 
                  ? 'text-blue-600' 
                  : 'text-gray-600'
            }`}
          >
            {msg.type === 'system' ? (
              <span>{msg.text}</span>
            ) : (
              <>
                <span className="font-bold">{msg.userId === userId ? 'You' : msg.userId}: </span>
                {msg.text}
              </>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-grow mr-2 p-2 border rounded"
          placeholder="Type a message..."
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}
