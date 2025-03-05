import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function ProtectedRoute({ allowedRole }) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;
        setUserRole(role);
        setLoading(false);
        if (role !== allowedRole) {
          navigate("/login"); // Redirect if role doesn't match
        }
      } else {
        navigate("/login"); // Redirect if not logged in
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate, allowedRole]);

  if (loading) return <Typography>Loading...</Typography>;

  return userRole === allowedRole ? <Component /> : null;
}

export default ProtectedRoute;
