"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Faq } from "@/types/faq";

interface FaqAccordionProps {
  faqs: Faq[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {faqs.map((faq) => (
        <AccordionItem
          key={faq.id}
          value={faq.id}
          className="border border-gray-200 bg-white"
        >
          <AccordionTrigger className="text-left text-sm font-semibold text-gray-900 hover:no-underline hover:text-gray-600 px-5 py-4">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-gray-600 leading-relaxed px-5 pb-4">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
