'use client'

import React, { useCallback, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketProviderProps {
    children?: React.ReactNode;
}

interface ISocketContext {
    sendMessage: (msg: string) => any;
    messages: string[]
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
    const state = useContext(SocketContext);
    if (!state) throw new Error(`state is undefined`);

    return state;
};


export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket>();
    const [messages, setMessages] = useState<string[]>([]);

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZjYxY2UyNS1hN2I2LTQzNzQtYTg4NS03MmRlNzVlYjIwNGMiLCJlbWFpbCI6ImJoYW51a2FAZ21haWwuY29tIiwiaWF0IjoxNzYyNjkwMzcxLCJleHAiOjE3NjMyOTUxNzF9.0NwSnOivAe2nun48RsWPGmcMY1HXzWg44O4iGg3-dOo";

    const sendMessage: ISocketContext["sendMessage"] = useCallback(
        (msg) => {
            console.log("Send Message", msg);
            if (socket) {
                socket.emit('event:message', { message: msg , token});
            }
        },
        [socket]
    );

    const onMessageRec = useCallback((msg: string) => {
        console.log("From Server Msg Rec", msg);
        const { message } = JSON.parse(msg) as { message: string };
        setMessages((prev) => [...prev, message]);
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
    }, []);

    return (
        <SocketContext.Provider value={{ sendMessage, messages }}>
            {children}
        </SocketContext.Provider>
    );
};