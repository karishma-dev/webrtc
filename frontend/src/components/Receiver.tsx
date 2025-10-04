import { useEffect, useState } from "react";

export function Receiver() {
	useEffect(() => {
		const socket = new WebSocket("ws://localhost:8080");

		socket.onopen = () => {
			socket.send(
				JSON.stringify({
					type: "receiver",
				})
			);
		};

		startReceivingVideo(socket);
	}, []);

	function startReceivingVideo(socket: WebSocket) {
		const pc = new RTCPeerConnection();

		pc.ontrack = (event) => {
			const stream =
				event.streams && event.streams[0]
					? event.streams[0]
					: new MediaStream([event.track]);

			const videoElement = document.querySelector("video");
			if (videoElement) {
				videoElement.srcObject = stream;
				videoElement.play().catch((err) => {
					console.warn("Receiver: video.play() failed", err);
				});
			}
		};

		socket.onmessage = async (event) => {
			try {
				const message = JSON.parse(event.data);

				if (message.type === "createOffer") {
					await pc.setRemoteDescription(message.sdp);

					const answer = await pc.createAnswer();
					await pc.setLocalDescription(answer);

					socket.send(
						JSON.stringify({ type: "createAnswer", sdp: pc.localDescription })
					);
				} else if (message.type === "iceCandidate") {
					try {
						await pc.addIceCandidate(message.candidate);
					} catch (err) {
						console.error("Receiver: addIceCandidate failed", err);
					}
				}
			} catch (err) {
				console.error("Receiver: error handling message", err);
			}
		};
	}

	return (
		<div>
			receiver
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
