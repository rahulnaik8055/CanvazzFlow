import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface IProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  // new fields from the membership query
  myRole?: "owner" | "editor" | "viewer";
  memberCount?: number;
  visibility?: "public" | "private";
}

interface ProjectCardProps {
  project: IProject;
  onClick?: (project: IProject) => void;
}

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-gray-900 text-white",
  editor: "bg-blue-50 text-blue-600 border border-blue-100",
  viewer: "bg-gray-100 text-gray-500",
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card
      onClick={() => onClick?.(project)}
      className="hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group"
    >
      {project.thumbnail ? (
        <img
          src={project.thumbnail}
          alt={project.name}
          className="w-full h-32 object-cover rounded-t-lg"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
          <span className="text-2xl text-gray-300 group-hover:scale-110 transition-transform">
            ◻
          </span>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold truncate">
            {project.name}
          </CardTitle>
          {project.myRole && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${ROLE_STYLES[project.myRole]}`}
            >
              {project.myRole}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {project.description ?? "No description provided."}
        </p>
      </CardContent>

      <CardFooter className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(project.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>

        <div className="flex items-center gap-2">
          {project.memberCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              {project.memberCount} member{project.memberCount !== 1 ? "s" : ""}
            </span>
          )}
          {project.visibility === "private" && (
            <span className="text-xs text-muted-foreground">🔒</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
