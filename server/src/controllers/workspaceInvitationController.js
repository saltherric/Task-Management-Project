const { createInvitation, acceptInvitation, declineInvitation, cancelInvitation} = require("../services/workspaceInvitationService");


const createInvitationController = async (req, res, next) => {
    try {
        const invatation = await createInvitation({
            workspaceId: req.params.workspaceId,
            invitedBy: req.user,
            invitedUser: req.body.invitedUser
        });
        res.status(201).json({
            message: "success",
            invatation,
        });
    } catch (error) {
        next(error);
    }
};


const getMyInvitationsController = async (req, res, next) => {
    try {
        const invitations = await getMyInvitations({
            userId: req.user._id,
        });
    } catch (error) {
        next(error);
    }
};

const acceptInvitationController = async (req, res, next) => {
    try {
        const invitation = await acceptInvitation({
            invitationId: req.params.invitationId,
            userId: req.user._id,
        });
        res.status(200).json({
            message: "Invitation accepted successfully.",
            invitation,
        });
    } catch (error) {
        next(error);
    }
};

const declineInvitationController = async (req, res, next) => {
    try {
        const invitation = await declineInvitation({
            invitationId: req.params.invitationId,
            userId: req.user._id,
        });

        res.status(200).json({
            message: "Invitation declined successfully.",
            invitation,
        });
    } catch (error) {
        next(error);
    }
};

const cancelInvitationController = async (req, res, next) => {
    try {
        const result = await cancelInvitation({
            invitationId: req.params.invitationId,
            userId: req.user._id,
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getWorkspaceInvitationsController = async (req, res, next) => {
    try {
        const invitations = await getWorkspaceInvitations({
            workspaceId: req.params.workspaceId,
            userId: req.user._id,
        });

        res.status(200).json(invitations);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createInvitationController,
    getMyInvitationsController,
    acceptInvitationController,
    declineInvitationController,
    cancelInvitationController,
    getWorkspaceInvitationsController
};