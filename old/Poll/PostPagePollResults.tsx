import PollResultsPieChart from '@pages/PostPage/Poll/PollResultsPieChart'
import PollResultsTimeGraph from '@pages/PostPage/Poll/PollResultsTimeGraph'
import styles from '@styles/pages/PostPage/PostPagePollResults.module.scss'
import React from 'react'
// import PollResultsAnswer from './Poll/PollResultsAnswer'
// import { PostContext } from '../../contexts/PostContext'

const PostPagePollResults = (): JSX.Element => {
    // const { pollAnswersSortedByScore } = useContext(PostContext)

    return (
        <div className={styles.pollResults}>
            <div className={styles.display}>
                <PollResultsPieChart />
                <PollResultsTimeGraph />
            </div>
            {/* {pollAnswersSortedByScore &&
                pollAnswersSortedByScore.map((answer, index) => (
                    <PollResultsAnswer answer={answer} key={answer.id} index={index} />
                ))} */}
        </div>
    )
}

export default PostPagePollResults

// import PollResultsFilters from './PollResultsFilters'
// <PollResultsFilters pageUrl={pageUrl} />
