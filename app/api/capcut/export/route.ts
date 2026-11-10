import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import util from "util";

const execFilePromise = util.promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, projectName, videoPath } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing required field: projectId" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scripts", "compile_capcut_draft.py");

    const args = ["--project-id", projectId];
    if (projectName) {
      args.push("--project-name", projectName);
    }
    if (videoPath) {
      args.push("--video-path", videoPath);
    }

    const { stdout, stderr } = await execFilePromise("python", [scriptPath, ...args], {
      cwd: process.cwd(),
      timeout: 30000,
    });

    if (stderr && !stdout) {
      console.error("CapCut compiler error:", stderr);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed compiling CapCut draft:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error while compiling CapCut draft" },
      { status: 500 }
    );
  }
}
