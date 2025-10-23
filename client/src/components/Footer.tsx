export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground" data-testid="text-footer">
          2025 ©CHUNIL. Copyright All Rights Reserved{" "}
          <a 
            href="https://www.chunilkor.co.kr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline"
            data-testid="link-company-website"
          >
            www.chunilkor.co.kr
          </a>
        </p>
      </div>
    </footer>
  );
}
