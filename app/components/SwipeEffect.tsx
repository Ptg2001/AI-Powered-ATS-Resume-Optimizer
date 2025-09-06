import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Feature = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    title: "Optimize your resume for real ATS screening",
    description: "Resumind analyzes your resume like an ATS, extracts keywords from the job description, and gives actionable fixes so you get more callbacks."
  },
  {
    title: "Boost your chances of getting more interviews",
    description: "Resumind improves your resume with the right keywords, highlights missing skills, and makes it stand out to recruiters."
  },
  {
    title: "Tailor your resume for every job application",
    description: "Resumind suggests role-specific keywords, optimizes phrasing, and ensures your resume passes recruiter screening filters."
  }
];

export default function SwipeEffect() {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % features.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setIndex((prev) => (prev + 1) % features.length);
  const prev = () => setIndex((prev) => (prev - 1 + features.length) % features.length);

  return (
      <div className="flex items-center justify-between">
      
        <button onClick={prev} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 hidden sm:block">
          <ChevronLeft />
        </button>
  
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-center">{features[index].title}</h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed mt-10 text-center" >{features[index].description}</p>
            </motion.div>
          </AnimatePresence>

        <button onClick={next} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 hidden sm:block">
          <ChevronRight />
        </button>
      </div>
    
  );
}