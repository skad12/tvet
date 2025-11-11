// "use client";
// import { useState } from "react";

// const faqs = [
//   { q: "Who can apply?", a: "Any Nigerian with required documentation." },
//   { q: "How long does registration take?", a: "Usually within 24–48 hours." },
//   {
//     q: "What documents are required?",
//     a: "Valid ID, proof of residence, educational certificates.",
//   },
// ];

// export default function FAQ() {
//   const [open, setOpen] = useState(null);
//   return (
//     <div className="max-w-3xl mx-auto mt-8">
//       <h3 className="text-2xl font-semibold mb-4">
//         Frequently Asked Questions
//       </h3>
//       <div className="space-y-2">
//         {faqs.map((f, i) => (
//           <div key={i} className="bg-white rounded shadow-sm">
//             <button
//               onClick={() => setOpen(open === i ? null : i)}
//               className="w-full flex justify-between px-4 py-3"
//             >
//               <span className="font-medium">{f.q}</span>
//               <span>{open === i ? "-" : "+"}</span>
//             </button>
//             {open === i && <div className="px-4 pb-4 text-sm">{f.a}</div>}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// "use client";
// import { useState } from "react";

// const faqData = {
//   Finance: [
//     {
//       q: "Is there a fee?",
//       a: "No, registration for TVET Support is free of charge.",
//     },
//     {
//       q: "How do I receive my stipend/allowance?",
//       a: "Stipends are paid directly into your registered bank account after verification.",
//     },
//   ],
//   General: [
//     {
//       q: "Who can apply?",
//       a: "Any Nigerian with valid identification and required documentation.",
//     },
//     {
//       q: "How long does registration take?",
//       a: "Processing usually takes 24–48 hours once all details are complete.",
//     },
//   ],
//   Onboarding: [
//     {
//       q: "I can’t log in to my account. What should I do?",
//       a: "Use the 'Forgot Password' option or contact support via the ticket form.",
//     },
//     {
//       q: "Can I update my registration details?",
//       a: "Yes, after logging in you can edit personal information from your dashboard.",
//     },
//   ],
//   Registration: [
//     {
//       q: "What documents are required?",
//       a: "You’ll need a valid ID, proof of residence, and your educational certificates.",
//     },
//     {
//       q: "Is online registration supported?",
//       a: "Yes, you can register and submit your documentation entirely online.",
//     },
//   ],
// };

// export default function FAQ() {
//   const [category, setCategory] = useState("Finance");
//   const [open, setOpen] = useState(null);

//   const currentFaqs = faqData[category];

//   return (
//     <section id="faq" className="bg-slate-50 py-16">
//       <div className="max-w-4xl mx-auto px-4 text-center">
//         <h2 className="text-3xl font-bold mb-6 text-slate-800">
//           Frequently Asked Questions
//         </h2>

//         {/* Tabs */}
//         <div className="flex justify-center gap-4 mb-8 border-b">
//           {Object.keys(faqData).map((cat) => (
//             <button
//               key={cat}
//               onClick={() => {
//                 setCategory(cat);
//                 setOpen(null);
//               }}
//               className={`px-4 py-2 text-sm font-medium ${
//                 category === cat
//                   ? "text-blue-600 border-b-2 border-blue-600"
//                   : "text-gray-600 hover:text-blue-500"
//               }`}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>

//         {/* FAQ Items */}
//         <div className="text-left space-y-2">
//           {currentFaqs.map((f, i) => (
//             <div key={i} className="bg-white rounded-lg shadow-sm border">
//               <button
//                 onClick={() => setOpen(open === i ? null : i)}
//                 className="w-full flex justify-between items-center px-4 py-3 text-left"
//               >
//                 <span className="font-medium text-slate-800">{f.q}</span>
//                 <span className="text-xl text-slate-500">
//                   {open === i ? "−" : "+"}
//                 </span>
//               </button>
//               {open === i && (
//                 <div className="px-4 pb-4 text-sm text-slate-600">{f.a}</div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";

const FALLBACK = {
  Finance: [
    {
      q: "Is there a fee?",
      a: "No, registration for TVET Support is free of charge.",
    },
    {
      q: "How do I receive my stipend/allowance?",
      a: "Stipends are paid directly into your registered bank account after verification.",
    },
  ],
  General: [
    {
      q: "Who can apply?",
      a: "Any Nigerian with valid identification and required documentation.",
    },
    {
      q: "How long does registration take?",
      a: "Processing usually takes 24–48 hours once all details are complete.",
    },
  ],
  Onboarding: [
    {
      q: "I can’t log in to my account. What should I do?",
      a: "Use the 'Forgot Password' option or contact support via the ticket form.",
    },
    {
      q: "Can I update my registration details?",
      a: "Yes, after logging in you can edit personal information from your dashboard.",
    },
  ],
  Registration: [
    {
      q: "What documents are required?",
      a: "You’ll need a valid ID, proof of residence, and your educational certificates.",
    },
    {
      q: "Is online registration supported?",
      a: "Yes, you can register and submit your documentation entirely online.",
    },
  ],
};

function normalizeFromObject(obj) {
  // obj: { category: [ { ... }, ... ] }
  const out = {};
  for (const [cat, items] of Object.entries(obj)) {
    if (!Array.isArray(items)) continue;
    out[cat] = items.map((it) => {
      return {
        q: it.q ?? it.question ?? it.title ?? it.heading ?? "",
        a: it.a ?? it.answer ?? it.body ?? it.content ?? "",
      };
    });
  }
  return out;
}

function normalizeFromArray(arr) {
  // arr: [ { category?, question?, answer? ... }, ... ]
  const out = {};
  for (const it of arr) {
    const category =
      it.category ??
      it.category_title ??
      it.category_name ??
      it.section ??
      "General";
    const q = it.q ?? it.question ?? it.title ?? it.heading ?? "";
    const a = it.a ?? it.answer ?? it.body ?? it.content ?? "";
    if (!out[category]) out[category] = [];
    out[category].push({ q, a });
  }
  return out;
}

export default function FAQ() {
  const [faqData, setFaqData] = useState(FALLBACK);
  const [category, setCategory] = useState(Object.keys(FALLBACK)[0]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/get-all-faqs/");
        const body = res?.data;

        let normalized = null;

        if (!body) {
          normalized = FALLBACK;
        } else if (Array.isArray(body)) {
          normalized = normalizeFromArray(body);
        } else if (typeof body === "object") {
          // could be already in category -> items form OR a single object item
          // detect if values are arrays (category mapping)
          const valuesAreArrays = Object.values(body).every((v) =>
            Array.isArray(v)
          );
          if (valuesAreArrays) {
            normalized = normalizeFromObject(body);
          } else {
            // might be an array-like object or single FAQ -> wrap as array
            normalized = normalizeFromArray(
              Array.isArray(body) ? body : [body]
            );
          }
        } else {
          normalized = FALLBACK;
        }

        // If normalized empty, fallback
        if (!normalized || Object.keys(normalized).length === 0) {
          normalized = FALLBACK;
        }

        if (mounted) {
          setFaqData(normalized);
          setCategory(Object.keys(normalized)[0]);
        }
      } catch (err) {
        console.error("Failed to load FAQs", err);
        if (mounted) {
          setError("Failed to load FAQs — showing default content.");
          setFaqData(FALLBACK);
          setCategory(Object.keys(FALLBACK)[0]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = Object.keys(faqData);

  return (
    <section id="faq" className="bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6 text-slate-800">
          Frequently Asked Questions
        </h2>

        {loading ? (
          <div className="py-8 text-sm text-slate-500">Loading FAQs…</div>
        ) : (
          <>
            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-8 border-b">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setOpen(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium ${
                    category === cat
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-blue-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="text-left space-y-2">
              {(faqData[category] || []).map((f, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border">
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex justify-between items-center px-4 py-3 text-left"
                  >
                    <span className="font-medium text-slate-800">
                      {f.q || "Untitled question"}
                    </span>
                    <span className="text-xl text-slate-500">
                      {open === i ? "−" : "+"}
                    </span>
                  </button>
                  {open === i && (
                    <div className="px-4 pb-4 text-sm text-slate-600">
                      {f.a || "No answer provided."}
                    </div>
                  )}
                </div>
              ))}

              {/* empty state */}
              {(!faqData[category] || faqData[category].length === 0) && (
                <div className="p-6 bg-white rounded shadow-sm text-sm text-slate-600">
                  No FAQs found for this category.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
