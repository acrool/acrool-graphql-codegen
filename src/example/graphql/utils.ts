export type TFileMapVariables = Record<string, any>;
interface IConvertRes {variables: TFileMapVariables, map: string[], values: File[]}


const isFile = input => 'File' in window && input instanceof File;
const isBlob = input => 'Blob' in window && input instanceof Blob;



/**
 * 處理表單送出時, 將 data object 轉換成 graphql upload 格式
 * @param originVariables
 * @param parentKey
 */
export const getVariablesFileMap = <V extends TFileMapVariables|undefined>(originVariables: V, parentKey: string[] = ['variables']): IConvertRes => {
    return originVariables && Object.keys(originVariables).reduce((curr: IConvertRes, key) => {
        const row = originVariables[key];
        if(isFile(row) || isBlob(row)){
            const file = row;
            return {
                variables: {...curr.variables, [key]: null},
                map: [...curr.map, parentKey.concat(key).join('.')],
                values: [...curr.values, file],
            };

        }else if(row && typeof row === 'object'){
            // 如果是Object, 往下繼續帶上層Key
            const children = getVariablesFileMap(row as TFileMapVariables, parentKey.concat(key));
            return {
                variables: {...curr.variables, [key]: children.variables},
                map: [...curr.map, ...children.map],
                values: [...curr.values, ...children.values],
            };
        }


        return {
            ...curr,
            variables: {...curr.variables, [key]: row},
            values: curr.values,
        };

    }, {variables: {}, map: [], values: []});
};
