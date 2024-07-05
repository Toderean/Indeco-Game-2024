import { useContext, useState } from "react"
import { SocketContext } from "./SocketContext"
import GameBoard from "./GameBoard"


export default function Rooms({ userData }) {
    const socket = useContext(SocketContext)
    const [userList, setUserList] = useState([])
    const [joinRequests, setJoinRequests] = useState([])
    const [opponentId, setOpponentId] = useState(null)
    const [isAwaitingResponse, setIsAwaitingResponse] = useState(false)

    //TODO: fix component sometimes rendering only after user refresh message is sent (missing it)
    socket.onmessage = ({ data }) => {
        console.log("Socket data from Rooms: ", data)

       try {
           const parsedMessage = JSON.parse(data)
           console.log("Parsed message type: ", parsedMessage.messageType)

            if(parsedMessage.messageType === "userRefresh")
                setUserList(parsedMessage.users)

            if(parsedMessage.messageType === "joinRequest") {
                const client = userList.find((user) => user.userId === parsedMessage.clientId)

                setJoinRequests(prevRequests => [...prevRequests, client])
            }

            if(parsedMessage.messageType === "acceptRequest") {
                if(isAwaitingResponse)
                    setIsAwaitingResponse(false)
            }

            if(parsedMessage.messageType === "cancelRequest") {
                const { cancellerType, cancellerId } = parsedMessage

                if(cancellerType === 'host'){
                    setOpponentId(null)
                    setIsAwaitingResponse(false)
                }

                if(cancellerType === 'client')
                    setJoinRequests(prevRequests => prevRequests.filter((request) => request.userId !== cancellerId))
            }

        } catch (err) {
            console.log(err)
        }
    }

    console.log("User list: ", userList)

    const handleSendJoinRequest = (host) => {
        const { userId: hostId } = host

        socket.send(JSON.stringify({ messageType: 'joinRequest', clientId: userData.userId, hostId }))

        setOpponentId(hostId)
        setIsAwaitingResponse(true)
    }

    const handleRequestAccept = (e) => {
        const { value: clientId } = e.target

        socket.send(JSON.stringify({ messageType: 'acceptRequest', clientId, hostId: userData.userId }))

        setOpponentId(clientId)
    }


    const handleRequestCancel = (cancellerType, targetId) => {
        socket.send(JSON.stringify({ messageType: 'cancelRequest', cancellerType, targetId, cancellerId: userData.userId }))

        if(cancellerType === 'host') {
            setJoinRequests(prevRequests => prevRequests.filter((request) => request.userId !== targetId))
        }

        if(cancellerType === 'client') {
            setOpponentId(null)
            setIsAwaitingResponse(false)
        }
    }

    //TODO: destructure user object, only send id in request
    const userMap = userList.map((user) => (
        <li key={user.userId}>
            {user.username}
            <button 
                onClick={() => handleSendJoinRequest(user)}
            >
                {user.userStatus === "available" ? "Join" : "Playing"}
            </button>
        </li>)
        )

    const requestMap = joinRequests.map(({ userId, username }) => (
        <li key={userId}>
            <span>{username} has requested to play with you.</span>
            <button value={userId} onClick={handleRequestAccept}>Accept</button>
            <button onClick={() => handleRequestCancel('host', userId)}>Decline</button>
        </li>
    ))

    const opponentData = userList.find((user) => user.userId === opponentId)

    return (
        <>
        {
            isAwaitingResponse 
            ?
                <div className="container">
                    <h1>Awaiting response from user {opponentData.username}.</h1>
                    <button onClick={() => handleRequestCancel('client', opponentData.userId)}>Cancel</button>
                </div>
            :
                opponentId
                ?
                    <GameBoard />
                :
                    <div>
                        <ul>
                            {userMap}
                        </ul>
                        {joinRequests.length > 0 && 
                            <ul>
                                {requestMap}
                            </ul>
                        }
                    </div>
        }
        </>
    )
}