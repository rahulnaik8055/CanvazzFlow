import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface IProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

interface ProjectCardProps {
  project: IProject;
  onClick?: (project: IProject) => void;
}

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
        <CardTitle className="text-sm font-semibold truncate">
          {project.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {project.description ?? "No description provided."}
        </p>
      </CardContent>

      <CardFooter className="pt-2 border-t border-gray-100">
        <span className="text-xs text-muted-foreground">
          {new Date(project.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </CardFooter>
    </Card>
  );
}
