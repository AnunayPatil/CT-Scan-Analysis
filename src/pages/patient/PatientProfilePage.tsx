import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

export default function PatientProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Basic account information (read-only).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`}
              alt={user.firstName}
              className="h-14 w-14 rounded-full border"
            />
            <div>
              <div className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <Badge className="mt-2 capitalize" variant="outline">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Patient record</div>
              <div className="mt-1 font-medium">{user.patientId || "Not linked"}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Last login</div>
              <div className="mt-1 font-medium">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            For changes to your profile information, please contact your care team.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

