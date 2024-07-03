import { useState } from "react"
import Lobbies from "./Lobbies"

export default function Socket() {
    //const [socket] = useState(new WebSocket(`ws://${location.host}`))
    const [socket] = useState(new WebSocket(`ws://localhost:8080`))
    const [message, setMessage] = useState('')
    const [userCredentials, setUserCredentials] = useState(null)
    const [userList, setUserList] = useState([])

    socket.onmessage = ({ data }) => {
        console.log(data)
        try {
            const parsedMessage = JSON.parse(data)
    
            if(parsedMessage.messageType === "authentication")
                setUserCredentials({ userId: parsedMessage.userId, username: parsedMessage.username})
    
            if(parsedMessage.messageType === "userRefresh")
                setUserList(parsedMessage.users)
        } catch (err) {
            console.log(err)
        }
    }

    const handleChange = (e) => {
        const { value } = e.target

        setMessage(value)
    }

    const handleClick = (e) => {
        e.preventDefault()

        socket.send(JSON.stringify({ registerAs: message }))
    }

    return (
        <>
        {
            userCredentials
            ? 
                <Lobbies userList={userList}/>
            : 
                <div>
                    <form>
                        <input type='text' value={message} onChange={handleChange}/>
                        <button type="submit" value="Submit" onClick={handleClick}/>
                    </form>
                </div>
        }
        </>

    )
}