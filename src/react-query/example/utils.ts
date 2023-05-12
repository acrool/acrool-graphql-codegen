export type TFileMapVariables = Record<string, unknown>;
interface IConvertRes {variables: TFileMapVariables, map: string[], values: Array<File|Blob>}


const isFile = (input: any): input is File => 'File' in window && input instanceof File;
const isBlob = (input: any): input is Blob => 'Blob' in window && input instanceof Blob;



/**
 * 處理表單送出時, 將 data object 轉換成 graphql upload 格式
 * @param originVariables
 * @param parentKey
 */
export const getVariablesFileMap = <V extends TFileMapVariables>(originVariables: V): IConvertRes => {
    const result: IConvertRes = {variables: {}, map: [], values: []};

    const traverse = (obj: TFileMapVariables, path: string[]) => {
        Object.entries(obj).forEach(([key, val]) => {
            const newPath = [...path, key];
            if(isFile(val) || isBlob(val)){
                const file = val;
                result.variables[key] = null;
                result.map.push(newPath.join('.'));
                result.values.push(file);

            } else if(val && typeof val === 'object'){
                // 如果是Object, 往下繼續帶上層Key
                result.variables[key] = {};
                traverse(val as TFileMapVariables, newPath);
            } else {
                result.variables[key] = val;
            }
        });
    };

    traverse(originVariables, ['variables']);

    return result;
};
