// public/script.js
let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const socket = new WebSocket(`ws://${location.host}`);
let myId;

socket.onmessage = async (message) => {
  const data = JSON.parse(message.data);
  const { type, from, payload } = data;

  switch (type) {
    case 'offer':
      await createAnswer(payload, from);
      break;
    case 'answer':
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
      break;
    case 'ice':
      await peerConnection.addIceCandidate(new RTCIceCandidate(payload));
      break;
  }
};

function send(type, to, payload) {
  socket.send(JSON.stringify({ type, to, from: myId, payload }));
}

async function startCall() {
  myId = document.getElementById('my-id').value;
  const friendId = document.getElementById('friend-id').value;

  send('register', null, null);

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById('localVideo').srcObject = localStream;

  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) send('ice', friendId, event.candidate);
  };

  peerConnection.ontrack = (event) => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  send('offer', friendId, offer);
}

async function createAnswer(offer, from) {
  myId = document.getElementById('my-id').value;
  document.getElementById('friend-id').value = from;

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById('localVideo').srcObject = localStream;

  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) send('ice', from, event.candidate);
  };

  peerConnection.ontrack = (event) => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  send('answer', from, answer);
}
const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`);
