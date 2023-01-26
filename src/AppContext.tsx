import React, { ReactElement, useState } from 'react';
import {
    createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    query,
    where,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    updateDoc } from 'firebase/firestore';
import { auth, db, storage } from './Firebase';
import { v4 as uuidv4 } from 'uuid';

interface Props {
    children:
      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
      | React.ReactNodeArray
      | React.ReactPortal;
}

interface userTypes {
    displayName: string | null;
    userId: string;
    avatar?: string | null;
}

interface registrationTypes {
    displayName: string;
    email: string;
    password: string;
}
interface todoItemInterface {
    value: string;
    itemId: string;
}

interface contextTypes {
    loading: boolean;
    currentUser: userTypes | null;
    todoItems: todoItemInterface[];
    logInUser(email: string, password: string): Promise<void>;
    registerUser(data: registrationTypes): Promise<void>;
    updateAvatar(file: { image: Blob, ext: string }): Promise<void>;
    signOutUser(): Promise<void>;
    addTodoItem(value: string): Promise<void>;
    updateTodoItem(params: { newValue: string, id: string }): Promise<void>;
    deleteTodoItem(id: string): Promise<void>;
    getTodoItems(): Promise<void>
    handleAuthChange: (params: { cb?: VoidFunction; err?: VoidFunction }) => void;
}

const contextDefaultVal: contextTypes = {
    loading: false,
    currentUser: null,
    todoItems: [],
    logInUser: async() => {},
    registerUser: async() => {},
    updateAvatar: async() => {},
    signOutUser: async() => {},
    addTodoItem: async() => {},
    updateTodoItem: async() => {},
    deleteTodoItem: async() => {},
    getTodoItems: async() => {},
    handleAuthChange: () => {},
}
export const AppContext = React.createContext<contextTypes>(
  contextDefaultVal
);

export default function AppContextProvider( { children }: Props): ReactElement {
    const [currentUser, setCurrentUser] = useState<userTypes | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [todoItems, setTodoItems] = useState<todoItemInterface[]>([]);
    
    const logInUser = async (email: string, password: string) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            alert(err);
        } finally {
            setLoading(false);
        }
    };
    
    const registerUser = async (data: registrationTypes) => {
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, data.email, data.password)
              .then(async ({ user}) => {
                await updateProfile(user, {
                    displayName: data.displayName,
                });
            });
        } catch (err) {
            alert(err);
        } finally {
            setLoading(false);
        }
    };
    
    const updateAvatar = async (file: { image: Blob; ext: string }) => {
        try {
            if (auth.currentUser !== null) {
                //File reference
                const uploadRef = ref(storage, `profileImages/${auth.currentUser.uid}-${uuidv4()}.${file.ext}`);
                const avatarRef = await uploadBytes(uploadRef, file.image);
                
                //Get the file url from firebase storage
                const image = await getDownloadURL(avatarRef.ref);
                
                //Update users photoURL
                await updateProfile(auth.currentUser, {
                    photoURL: image,
                });
                alert("Profile image updated");
                
                //Reload the current user to fetch new profileURL
                await auth.currentUser.reload();
            }
        } catch (err) {
            alert(err);
        }
    };
    
    const signOutUser = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            alert(err);
        }
    };
    
    const handleAuthChange = async (params: { cb?: VoidFunction; err?: VoidFunction }) => {
        onAuthStateChanged(auth, (user) => {
            if (user === null) {
                setCurrentUser(null);
                params.err && params.err();
            } else {
                setCurrentUser({
                    displayName: user.displayName,
                    userId: user.uid,
                    avatar: user.photoURL,
                });
                params.cb && params.cb();
            }
        });
    }
    
    const addTodoItem = async (value: string) => {
        try {
            //Document reference to be added
            const docRef = doc(
              db,
              "todo",
              uuidv4() // Firebase can generate unique id, if third parameter left empty
            );
            const userId = auth.currentUser;
            if (userId !== null) {
                await setDoc(docRef, {
                    userId: userId.uid,
                    value,
                });
                alert(`Item ${value}} added!`);
            }
        } catch (err) {
            alert(err);
        }
    };
    
    const getTodoItems = async () => {
        try {
            if (auth.currentUser !== null) {
                const userId = auth.currentUser.uid;
                
                //Query to get only the documents that matches the logged in user id
                const q = query(collection(db, "todo"), where("userId", "==", userId));
                const querySnapshot = await getDocs(q);
                
                //Reset the todo items value
                setTodoItems([]);
                
                //Map through the query result and assign the value to the todoItems state
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    setTodoItems((prev) => [
                      ...prev,
                        {
                            itemId: doc.id,
                            value: data.value,
                        },
                    ]);
                });
            }
        } catch (err) {
            alert(err);
        }
    };
    
    const updateTodoItem = async (params: { newValue: string; id: string }) => {
        try {
            //Reference to the document to update
            const docRef = doc(db, "todo", params.id);
            //Update the value of the todo item
            await updateDoc(docRef, {
                value: params.newValue
            });
            
            alert(`Item updated!`);
        } catch (err) {
            alert(err);
        }
    }
    
    const deleteTodoItem = async (id: string) => {
        try {
            //Reference to the document to delete
            const docRef = doc(db, "todo", id);
            await deleteDoc(docRef);
            
            alert(`item: ${id}} deleted!`);
        } catch (err) {
            alert(err);
        }
    };
    
    return (
      <AppContext.Provider
          value={{
                  loading,
                  currentUser,
                  logInUser,
                  registerUser,
                  handleAuthChange,
                  updateAvatar,
                  todoItems,
                  addTodoItem,
                  getTodoItems,
                  updateTodoItem,
                  deleteTodoItem,
                  signOutUser,
              }}
          > {children}
      </AppContext.Provider>
    )
}