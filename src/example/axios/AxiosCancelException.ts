interface IResponse {
    message: string
    code?: string | undefined
    args?: unknown
    path?: string
}

export default class AxiosCancelException extends Error {
    public readonly code;
    public readonly devInfo: any;
    public readonly args;
    public readonly path;

    constructor(
        private readonly response: IResponse,
    ) {
        super(response.message);
        this.code = response.code;
        this.args = response.args;
        this.path = response.path;

        this.initName();
    }

    public initName(): void {
        this.name = this.constructor.name;
    }

    public getInfo(): IResponse {
        return {
            message: this.response.message,
            code: this.response.code,
            args: this.response.args,
            path: this.response.path,
        };
    }

}
