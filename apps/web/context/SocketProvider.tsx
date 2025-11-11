'use client'

import React, { useCallback, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketProviderProps {
    children?: React.ReactNode;
}
// Chat message shape including sender
export interface ChatMessage {
    message: string;
    userName: string;
    userId?: string;
    createdAt?: string;
}

interface ISocketContext {
    sendMessage: (msg: string) => any;
    messages: ChatMessage[];
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
    const state = useContext(SocketContext);
    if (!state) throw new Error(`state is undefined`);

    return state;
};


export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const sendMessage: ISocketContext["sendMessage"] = useCallback(
        (msg) => {
            console.log("Send Message", msg);
            if (socket) {
                const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                socket.emit('event:message', { message: msg, token });
            }
        },
        [socket]
    );

    const onMessageRec = useCallback((msg: string) => {
        // incoming message is JSON string produced by the server/redis consumer
        try {
            const parsed = JSON.parse(msg) as { message: string; userName?: string; userId?: string; createdAt?: string };
            const chatMsg: ChatMessage = {
                message: parsed.message,
                userName: parsed.userName || 'Unknown',
                userId: parsed.userId,
                createdAt: parsed.createdAt,
            };
            setMessages((prev) => [...prev, chatMsg]);
        } catch (err) {
            console.error('Failed to parse incoming message', err, msg);
        }
    }, []);


    useEffect(() => {
        const _socket = io("http://localhost:8000");
        _socket.on("message", onMessageRec);
        setSocket(_socket);
        return () => {
            _socket.off("message", onMessageRec);
            _socket.disconnect();
            setSocket(undefined);
        };
    }, [onMessageRec]);

    return (
        <SocketContext.Provider value={{ sendMessage, messages }}>
            {children}
        </SocketContext.Provider>
    );
};