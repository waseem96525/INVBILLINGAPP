import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <>
      {/* The main content is now handled by routes in App.tsx */}
      {/* This page can be used for a landing page or removed if not needed */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <h1 className="text-4xl font-bold mb-4">Welcome to your POS App!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Use the navigation above to get started.</p>
      </div>
      <MadeWithDyad />
    </>
  );
};

export default Index;