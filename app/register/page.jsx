// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";

// export default function RegisterPage() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [msg, setMsg] = useState(null);

//   const submit = (e) => {
//     e.preventDefault();
//     setMsg("Registered (demo) — check your email");
//   };

//   return (
//     <motion.div
//       className="max-w-md mx-auto bg-white p-8 rounded shadow mt-20"
//       initial={{ opacity: 0, y: 30 }} // fade and slide up
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5, ease: "easeOut" }}
//     >
//       <h3 className="text-xl font-semibold mb-4 text-center">Create Account</h3>

//       <motion.form
//         onSubmit={submit}
//         className="space-y-4"
//         initial="hidden"
//         animate="visible"
//         variants={{
//           hidden: { opacity: 0 },
//           visible: {
//             opacity: 1,
//             transition: { staggerChildren: 0.1 },
//           },
//         }}
//       >
//         <motion.input
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           placeholder="Full name"
//           className="w-full border px-3 py-2 rounded"
//           required
//           variants={{
//             hidden: { opacity: 0, y: 10 },
//             visible: { opacity: 1, y: 0 },
//           }}
//         />

//         <motion.input
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           type="email"
//           placeholder="Email"
//           className="w-full border px-3 py-2 rounded"
//           required
//           variants={{
//             hidden: { opacity: 0, y: 10 },
//             visible: { opacity: 1, y: 0 },
//           }}
//         />

//         <motion.button
//           whileTap={{ scale: 0.95 }}
//           whileHover={{ scale: 1.03 }}
//           className="w-full bg-blue-600 text-white px-4 py-2 rounded"
//           variants={{
//             hidden: { opacity: 0, y: 10 },
//             visible: { opacity: 1, y: 0 },
//           }}
//         >
//           Register
//         </motion.button>

//         {msg && (
//           <motion.div
//             className="mt-2 text-green-700 text-sm text-center"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//           >
//             {msg}
//           </motion.div>
//         )}
//       </motion.form>
//     </motion.div>
//   );
// }

import RegisterForm from "@/components/register/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-start justify-center py-12">
      <RegisterForm />
    </main>
  );
}
