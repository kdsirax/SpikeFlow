import { Runtime } from "../routing-policy/routing-policy.types.js";
import { DockerExecutor } from "./docker.executor.js";
import { ServerlessExecutor } from "./serverless.executor.js";
export class RuntimeService {
    decisionEngineService;
    dockerExecutor;
    serverlessExecutor;
    constructor(decisionEngineService, dockerExecutor = new DockerExecutor(), serverlessExecutor = new ServerlessExecutor()) {
        this.decisionEngineService = decisionEngineService;
        this.dockerExecutor = dockerExecutor;
        this.serverlessExecutor = serverlessExecutor;
    }
    async execute(request) {
        const decision = await this.decisionEngineService.makeRoutingDecision(request.operationId);
        if (decision.runtime === Runtime.SERVERLESS) {
            return this.serverlessExecutor.execute(request);
        }
        return this.dockerExecutor.execute(request);
    }
}
//# sourceMappingURL=runtime.service.js.map