import { useRef } from "react";

export const usePrint = (title = "Medical Chart") => {
  const printRef = useRef();
  const handlePrint = () => {
    if (!printRef.current) return;
    const originalTitle = document.title;
    document.title = title;
    const style = document.createElement("style");
    style.id = "print-style";
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-root, #print-root * { visibility: visible; }
        #print-root {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 15mm;
          box-sizing: border-box;
          font-family: "Times New Roman", Times, serif;
        }
        .no-print { display: none !important; }
        .print-input {
          border: none !important;
          border-bottom: 1px solid #000 !important;
          background: transparent !important;
          outline: none !important;
          padding: 4px 2px !important;
          font-size: 11pt !important;
          text-align: center !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          margin-bottom: 20px;
        }
        th {
          border: 1px solid #000 !important;
          border-bottom: 2px solid #000 !important;
          padding: 8px 6px !important;
          font-size: 11pt !important;
          font-weight: bold !important;
          text-align: left !important;
          background-color: #f0f0f0 !important;
          -webkit-print-color-adjust: exact;
        }
        td {
          border: 1px solid #000 !important;
          padding: 8px 6px !important;
          font-size: 11pt !important;
          vertical-align: middle;
        }
        .print-header { display: block !important; margin-bottom: 20px; }
        .print-footer { border-top: 1px solid #000; padding-top: 10px; margin-top: 20px; }
        @page {
          margin: 10mm;
          size: A4 portrait;
        }
      }
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      const styleEl = document.getElementById("print-style");
      if (styleEl) document.head.removeChild(styleEl);
    }, 100);
  };
  return { printRef, handlePrint };
};
