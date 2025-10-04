import { useEffect, useState } from "react";
import { data } from "react-router-dom";

export function Sender() {
	const [socket, setSocket] = useState<WebSocket | null>(null);

	useEffect(() => {
		const socket = new WebSocket("ws://localhost:8080");

		socket.onopen = () => {
			socket.send(
				JSON.stringify({
					type: "sender",
				})
			);
		};

		setSocket(socket);
	}, []);

	async function startSendingVideo() {
		if (!socket) return;

		const pc = new RTCPeerConnection();
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		pc.onicecandidate = (event) => {
			if (event.candidate) {
				socket?.send(
					JSON.stringify({
						type: "iceCandidate",
						candidate: event.candidate,
					})
				);
			}
		};

		socket?.send(
			JSON.stringify({
				type: "createOffer",
				sdp: pc.localDescription,
			})
		);

		socket.onmessage = async (event) => {
			const message = JSON.parse(event.data);

			if (message.type === "createAnswer") {
				pc.setRemoteDescription(message.sdp);
			} else if (message.type === "iceCandidate") {
				pc.addIceCandidate(message.candidate);
			}
		};
	}

	return (
		<div>
			<span>sender</span>
			<button onClick={startSendingVideo}>Send video</button>
		</div>
	);
}
