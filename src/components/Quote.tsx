import { useState, useEffect } from 'react';
import { Quote as QuoteIcon } from 'lucide-react';

export const Quote = () => {
  const [quote, setQuote] = useState({
    text: "求知若饥，虚心若愚。",
    author: "史蒂夫·乔布斯"
  });

  // Could fetch from hitokoto.cn or similar API
  useEffect(() => {
    // Placeholder for API call
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 text-white text-center select-none">
      <QuoteIcon size={24} className="mb-2 opacity-40" />
      <p className="text-lg font-light italic leading-relaxed opacity-90">
        "{quote.text}"
      </p>
      <span className="mt-3 text-xs font-medium opacity-60 uppercase tracking-widest">
        — {quote.author}
      </span>
    </div>
  );
};
