// TODO: Migrate from Base44 UserNotRegisteredError.jsx
const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold text-destructive">User Not Registered</h1>
        <p className="text-muted-foreground">Please sign up to continue.</p>
      </div>
    </div>
  );
};
export default UserNotRegisteredError;
