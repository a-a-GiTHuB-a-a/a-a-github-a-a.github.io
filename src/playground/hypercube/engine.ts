import paper from "paper";
import $ from "jquery";

paper.setup($("canvas#content")[0] as HTMLCanvasElement);
const tool = new paper.Tool();
tool.activate();

