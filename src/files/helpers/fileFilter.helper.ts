export const fileFilter = ( req: Express.Request, file: Express.Multer.File, callback: Function ) => {
    // console.log({file});

    if( !file ) return callback( new Error( 'File is empty' ), false);

    const fileExtension = file.mimetype.split('/')[1];
    const valeExtension = ['jpg', 'jpeg', 'png', 'gif'];

    if (valeExtension.includes(fileExtension)) return callback(null, true);

    return callback(null, false);
    
}