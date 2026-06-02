const calculateSmartPriority = (priority, dueDate) => {
    let scores = 0;

    // dueDate scores
    if (dueDate) {
        const now = new Date();

        const taskDueDate = new Date(dueDate);

        const diffTime = taskDueDate - now;

        const dayLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dayLeft < 0) {
            scores += 100;
        }
        else if (dayLeft === 0) {
            scores += 80;
        }
        else if (dayLeft === 1) {
            scores += 70;
        }
        else if (dayLeft <= 3) {
            scores += 60;
        }
        else if (dayLeft <= 7) {
            scores += 40;
        }
        else if (dayLeft <= 14) {
            scores += 30;
        }
        else if (dayLeft <= 30) {
            scores += 20;
        }
        else {
            scores += 10;
        }
    }

    // priority scores
    if (priority === 'high') {
        scores += 30;
    } else if (priority === 'medium') {
        scores += 20;
    } else {
        scores += 10;
    }

    return scores;
}

module.exports = calculateSmartPriority;