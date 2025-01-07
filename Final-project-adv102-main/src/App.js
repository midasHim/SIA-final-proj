import React, { useRef, useState } from 'react';
import './App.css';
import './index.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyCYW80RzE7z0eXX4ANtvcdpgV29sdOw3vU",
  authDomain: "final-project-c862c.firebaseapp.com",
  projectId: "final-project-c862c",
  storageBucket: "final-project-c862c.appspot.com",
  messagingSenderId: "208695193866",
  appId: "1:208695193866:web:75ff4e14ff519c73f34af3",
  measurementId: "G-CNWPS9T3TJ"
});

const auth = firebase.auth();
const firestore = firebase.firestore();
const analytics = firebase.analytics();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App bg-gray-800 h-screen flex flex-col">
      <header className="bg-gray-900 text-white h-16 flex items-center justify-between px-4">
        <h1>Chat Room</h1>
        <SignOut />
      </header>

      <section className="flex flex-1 flex-col justify-center bg-gray-900">
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
      console.error('Error during sign-in:', error);
    });
  };

  return (
    <>
      <button className="sign-in bg-white text-gray-800 max-w-400px mx-auto" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
      <p className="text-white max-w-400px mx-auto mt-4">Do not violate the community guidelines or you will be banned for life!</p>
    </>
  );
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out bg-gray-800 text-white" onClick={() => auth.signOut()}>Sign Out</button>
  );
}

function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(25);
  const [messages] = useCollectionData(query, { idField: 'id' });
  const [formValue, setFormValue] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editMessageId, setEditMessageId] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    if (editMode) {
      const docRef = messagesRef.doc(editMessageId);
      const doc = await docRef.get();
      if (doc.exists) {
        await docRef.update({
          text: formValue,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        setEditMode(false);
        setEditMessageId('');
      } else {
        console.error('No document to update:', editMessageId);
      }
    } else {
      await messagesRef.add({
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL
      });
    }

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };

  const editMessage = (id, text) => {
    setEditMode(true);
    setEditMessageId(id);
    setFormValue(text);
  };

  const deleteMessage = async (id) => {
    const docRef = messagesRef.doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.delete();
    } else {
      console.error('No document to delete:', id);
    }
  };

  return (
    <>
      <main className="p-4 flex-1 overflow-y-scroll">
        {messages && messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} editMessage={editMessage} deleteMessage={deleteMessage} />
        ))}
        <span ref={dummy}></span>
      </main>

      <form className="bg-gray-900 flex items-center p-4" onSubmit={sendMessage}>
        <input
          className="w-full text-white bg-gray-700 px-4 py-2 rounded-full"
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Say something"
        />
        <button type="submit" disabled={!formValue} className="bg-gray-800 text-white px-4 py-2 rounded-full">🕊️</button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL, id } = props.message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message flex items-center ${messageClass === 'sent' ? 'justify-end' : 'justify-start'} mb-2`}>
      {uid !== auth.currentUser.uid && (
        <img src={photoURL} alt="User" className="w-10 h-10 rounded-full mr-2" />
      )}
      <p className={`p-2 rounded-lg ${messageClass === 'sent' ? 'bg-blue-300' : 'bg-gray-700'} text-white max-w-xs`}>
        {text}
      </p>
      {uid === auth.currentUser.uid && (
        <>
          <div className="flex items-center ml-2">
            <button className="bg-gray-800 text-white px-2 py-1 rounded-full" onClick={() => props.editMessage(id, text)}>Edit</button>
            <button className="bg-red-600 text-white px-2 py-1 rounded-full ml-1" onClick={() => props.deleteMessage(id)}>Delete</button>
          </div>
          <img src={photoURL} alt="User" className="w-10 h-10 rounded-full ml-2" />
        </>
      )}
    </div>
  );
}

export default App;