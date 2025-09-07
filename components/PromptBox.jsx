import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContext'
import { Axios } from 'axios'
import Image from 'next/image'
import React, { use, useState } from 'react'
import toast from 'react-hot-toast'

const PromptBox = ({ setIsLoading, isLoading }) => {

    const [promt, setPrompt] = useState('')
    const { user, chats, setChats, selectedChat, setSelectedChat } = useAppContext();

    const handleKeyDown = (e) => {
        if(e.key === "Enter" && !e.shiftKey){
            e.preventDefault();
            sendPrompt(e)
        }
    }

    const sendPrompt = async (e) => {
        const promptCopy = promt;
        try {
            e.preventDefault();
            if (!user) return toast.error("Login to send message");
            if (isLoading) return toast.error("Wait for the previous prompt response");
            setIsLoading(true)
            setPrompt("")
            const userPrompt = {
                role: "user",
                content: prompt,
                timestamp: Date.now()
            }
            setChats((prevChats) => {
                return prevChats.map((chat) => {
                    chat._id === selectedChat._id ? { ...chat, messages: [...chat.messages, userPrompt] } : chat
                })
            })
            setSelectedChat((prev) => ({
                ...prev,
                messages: [
                    ...prev.messages, userPrompt
                ]
            }))
            const { data } = await Axios.post('/api/chat/ai', {
                chatId: selectedChat._id,
                prompt
            })
            if (data.success) {
                setChats((prevChats) => prevChats.map((chat) => chat._id === selectedChat._id ? { ...chat, messages: [...chat.messages, data.data] } : chat))
                const message = data.data.content;
                const messageToken = message.split(" ");
                let assistantMessage = {
                    role: "assistant",
                    content: "",
                    timestamp: Date.now()
                }
                selectedChat((prev) => ({
                    ...prev,
                    messages: [
                        ...prev.messages, assistantMessage
                    ]
                }))
                for (let i = 0; i < messageToken.length; i++) {
                    setTimeout(() => {
                        assistantMessage.content = messageToken.slice(0, i + 1).join(" ")
                        setSelectedChat((prev) => {
                            const updatedMessages = [
                                ...prev.messages.slice(0, -1),
                                assistantMessage
                            ]
                            return { ...prev, messages: updatedMessages }
                        })
                    }, i * 100);
                }
            } else {
                toast.error(data.message)
                setPrompt(promptCopy)
            }
        } catch (error) {
            toast.error(error.message)
            setPrompt(promptCopy)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={sendPrompt} className={`w-full ${selectedChat?.messages.length > 0 ? 'max-w-3xl' : 'max-w-2xl'} bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}>
            <textarea onKeyDown={handleKeyDown} onChange={(e) => setPrompt(e.target.value)} value={promt} className='outline-none w-full resize-none overflow-hidden break-words bg-transparent' rows={2} placeholder='Message DeepSeek' required />
            <div className='flex items-center justify-between text-sm'>
                <div className='flex items-center gap-2'>
                    <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'><Image src={assets.deepthink_icon} alt='' className='h-5' />DeepThink (R1)</p>
                    <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'><Image src={assets.search_icon} alt='' className='h-5' />Search</p>
                </div>
                <div className='flex items-center gap-2'>
                    <Image src={assets.pin_icon} alt='' className='w-4 cursor-pointer' />
                    <button className={`${promt ? 'bg-primary' : 'bg-[#71717a]'} rounded-full p-2 cursor-pointer`}>
                        <Image src={promt ? assets.arrow_icon : assets.arrow_icon_dull} alt='' className='w-3.5 aspect-square' />

                    </button>
                </div>
            </div>
        </form>
    )
}

export default PromptBox
