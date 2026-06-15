const {createComment: createCommentService, getComments: getCommentsService } = require("../services/commentService");

const createComment = async (req, res, next) => {
    try {
        const comment = await createCommentService({
            taskId: req.params.taskId,
            user: req.user,
            commentData: req.body,
        })
        res.status(200).json({
            success: true,
            comment,
        })
    } catch (error) {
        next(errr)
    }
}

const getComments = async (req, res, next) => {
    try {
        const comments = await getCommentsService(req.params.taskId);
        res.status(200).json({
            success: true,
            comments,
        })
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createComment,
    getComments,
}