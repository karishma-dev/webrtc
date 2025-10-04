import { useEffect, useState } from "react";
import { data } from "react-router-dom";

export function Sender() {
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [video, setVideo] = useState<MediaStream | null>(null);

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

		pc.onnegotiationneeded = async () => {
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);
			socket?.send(
				JSON.stringify({
					type: "createOffer",
					sdp: pc.localDescription,
				})
			);
		};

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

		socket.onmessage = async (event) => {
			const message = JSON.parse(event.data);

			if (message.type === "createAnswer") {
				pc.setRemoteDescription(message.sdp);
			} else if (message.type === "iceCandidate") {
				pc.addIceCandidate(message.candidate);
			}
		};

		// const stream = await navigator.mediaDevices.getDisplayMedia({
		// 	video: true,
		// 	audio: false,
		// });
		const stream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: false,
		});
		setVideo(stream);
		const videoElement = document.querySelector("video");
		if (videoElement) {
			videoElement.srcObject = stream;
		}
		pc.addTrack(stream.getVideoTracks()[0]);
		// pc.addTrack(stream.getAudioTracks()[0]);
	}

	return (
		<div>
			<span>sender</span>
			<button onClick={startSendingVideo}>Send video</button>

			<div>
				<video
					style={{ width: 400, height: 300, backgroundColor: "black" }}
					autoPlay
					muted
				></video>
			</div>
		</div>
	);
}
