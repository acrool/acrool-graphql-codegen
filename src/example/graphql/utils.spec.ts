import {getVariablesFileMap} from './utils';



describe('Convert', () => {


    it('Base', async () => {

        const file1 = new File(['avatar'], 'avatar.webp', {type: 'image/jpeg'});
        const input = {
            teamId: 1,
            input: {
                name: 'Meta',
                desc: 'Meta Platforms, Inc.',
            },
            file1,
        };

        const result = getVariablesFileMap(input);

        // 預期結果
        const equalResult = {
            variables: {
                teamId: 1,
                input: {
                    name: 'Meta',
                    desc: 'Meta Platforms, Inc.',
                },
                file1: null,
            },
            map: ['variables.file1'],
            values: [file1]
        };

        expect(result).toStrictEqual(equalResult);
    });





    it('AddChild', async () => {
        const file1 = new File(['avatar'], 'avatar.webp', {type: 'image/jpeg'});
        const input = {
            teamId: 1,
            input: {
                name: 'Meta',
                desc: 'Meta Platforms, Inc.',
                info: {
                    tel: '0900112113',
                    address: null
                },
                file1,
            },
        };

        const result = getVariablesFileMap(input);


        // 預期結果
        const equalResult = {
            variables: {
                teamId: 1,
                input: {
                    name: 'Meta',
                    desc: 'Meta Platforms, Inc.',
                    info: {
                        tel: '0900112113',
                        address: null,
                    },
                    file1: null,
                },
            },
            map: ['variables.input.file1'],
            values: [file1]
        };

        expect(result).toStrictEqual(equalResult);
    });

    it('AddFile2', async () => {
        const file1 = new File(['avatar'], 'avatar.webp', {type: 'image/jpeg'});
        const file2 = new File(['thumb'], 'thumb.webp', {type: 'image/jpeg'});
        const input = {
            teamId: 1,
            input: {
                name: 'Meta',
                desc: 'Meta Platforms, Inc.',
                info: {
                    tel: '0900112113',
                    file2,
                },
                file1,
            },
        };

        const result = getVariablesFileMap(input);


        // 預期結果
        const equalResult = {
            variables: {
                teamId: 1,
                input: {
                    name: 'Meta',
                    desc: 'Meta Platforms, Inc.',
                    info: {
                        tel: '0900112113',
                        file2: null,
                    },
                    file1: null,
                },
            },
            map: ['variables.input.info.file2', 'variables.input.file1'],
            values: [file1, file2]
        };

        expect(result).toStrictEqual(equalResult);
    });



});
