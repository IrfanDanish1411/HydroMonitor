import sys
import os

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    os.system("pip install pdfplumber --user -q")
    import pdfplumber

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for i, page in enumerate(pdf.pages):
                text += f"\n\n--- Page {i+1} ---\n\n"
                text += page.extract_text()
            return text
    except Exception as e:
        return f"Error extracting PDF: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <pdf_file> [output_file]")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    text = extract_pdf_text(pdf_file)
    
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Extracted text saved to {output_file}")
    else:
        # Print to console with UTF-8 encoding
        sys.stdout.reconfigure(encoding='utf-8')
        print(text)
