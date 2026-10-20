import PublicLayout from '../../layouts/PublicLayout';

// Shared body of the 404 (W11) and 500 (W12) pages: illustration, big code, title, text, actions.
// The code is decorative; the h1 carries the message.
export default function ErrorPage({ code, illustration, title, children, actions, help }) {
  return (
    <PublicLayout mainClassName="flex items-center justify-center bg-surface-light-gray px-4 py-8 sm:px-16 sm:py-16">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-4 text-center">
        {illustration}
        <p aria-hidden="true" className="font-heading text-[72px] leading-[80px] font-bold text-text-blue sm:text-[112px] sm:leading-[120px]">
          {code}
        </p>
        <h1 className="type-h1 text-text-primary sm:type-display">{title}</h1>
        <p className="type-body text-text-muted sm:type-body-lg">{children}</p>
        <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">{actions}</div>
        {help}
      </div>
    </PublicLayout>
  );
}
