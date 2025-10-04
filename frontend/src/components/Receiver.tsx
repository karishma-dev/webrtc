import { useEffect, useState } from "react";

export function Receiver() {
	useEffect(() => {
		console.log("Receiver: creating WebSocket -> ws://localhost:8080");
		const socket = new WebSocket("ws://localhost:8080");

		socket.onopen = () => {
			console.log("Receiver: websocket open - sending receiver registration");
			socket.send(
				JSON.stringify({
					type: "receiver",
				})
			);
		};

		socket.onmessage = async (event) => {
			try {
				const message = JSON.parse(event.data);

				let pc: any = null;
				console.log("Receiver: message received", message);

				if (message.type === "createOffer") {
					pc = new RTCPeerConnection();
					await pc.setRemoteDescription(message.sdp);

					pc.onicecandidate = (event: { candidate: any }) => {
						if (event.candidate) {
							socket?.send(
								JSON.stringify({
									type: "iceCandidate",
									candidate: event.candidate,
								})
							);
						}
					};

					const answer = await pc.createAnswer();
					await pc.setLocalDescription(answer);

					socket.send(
						JSON.stringify({
							type: "createAnswer",
							sdp: pc.localDescription,
						})
					);
				} else if (message.type === "iceCandidate") {
					if (pc) {
						pc.addIceCandidate(message.candidate);
					}
				}
			} catch (err) {
				console.error("Receiver: error handling message", err);
			}
		};

		socket.onerror = (err) => {
			console.error("Receiver: websocket error", err);
		};

		socket.onclose = (ev) => {
			console.log("Receiver: websocket closed", ev);
		};

		return () => {
			socket.close();
		};
	}, []);

	return <div>receiver</div>;
}
