/* eslint-disable no-underscore-dangle */
/**
 *
 * Training
 *
 */

import React from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import injectSaga from 'utils/injectSaga';
import Timer from 'components/Timer/Timer';
import injectReducer from 'utils/injectReducer';
import { createStructuredSelector } from 'reselect';
import ProfileCard from 'components/Cards/ProfileCard';
import CloudDownload from '@material-ui/icons/CloudDownload';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  MenuItem,
  CardHeader,
  Typography,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Tooltip,
  Collapse,
  withTheme,
  CircularProgress,
} from '@material-ui/core';
import ReactJson from 'react-json-view';
import findIndex from 'lodash/findIndex';

import Status from './Status';
import reducer from './reducer';
import Table from './TrainingTable';
import saga, { watcher } from './saga';

import { changeTitle, getAgents } from '../HomePage/actions';
import { selectAgents } from '../HomePage/selectors';
import { getJSON, getAll, train, viewJSON, startWatch } from './actions';
import {
  selectLoading,
  selectGetting,
  selectJSON,
  selectTraining,
  selectInTraining,
} from './selectors';

const TimerWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
  flex-direction: column;
  text-align: center;
  .timer {
    font-size: 2em;
  }
`;

const StyledCP = styled(CircularProgress)`
  && {
    position: absolute;
    top: 20%;
    left: 50%;
  }
`;

export class Training extends React.PureComponent {
  // eslint-disable-line react/prefer-stateless-function

  constructor(props) {
    super(props);
    this.state = {
      agent: {},
    };
  }

  componentDidMount() {
    this.props.changeTitle('Training');
    this.props.getAgents();
    this.props.getAll();
    this.props.startWatch();
  }

  handleChange = name => event => {
    this.setState({
      [name]: this.props.agents[event.target.value],
    });
  };

  download = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(this.props.json.data),
    )}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `${this.props.json.agent}-${this.props.json.date}.json`,
    );
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  render() {
    const {
      agents,
      handleGetJSON,
      training,
      json,
      view,
      dispatch,
      inTraining,
      loading,
      theme: { palette },
    } = this.props;

    const agentStrings = agents.map(a => a.agent);
    const agentIndex =
      agentStrings && this.state.agent
        ? findIndex(agents, { _id: this.state.agent._id })
        : 0;

    return (
      <div>
        <Helmet>
          <title>训练</title>
          <meta name="description" content="Description of Training" />
        </Helmet>

        <Grid container spacing={24} style={{ marginTop: '10px' }}>
          <Grid item xs={8}>
            <Collapse
              in={Object.keys(json).length !== 0 && json.constructor === Object}
            >
              <div>
                <ExpansionPanel style={{ margin: '30px 2px 2px 1px' }}>
                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography
                      variant="h6"
                      style={{ alignSelf: 'center', flexGrow: 1 }}
                    >
                      Generated JSON
                    </Typography>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails
                    style={{ justifyContent: 'space-between' }}
                  >
                    <ReactJson
                      src={json.data}
                      theme={
                        palette.type === 'dark' ? 'eighties' : 'rjv-default'
                      }
                      style={{
                        backgroundColor:
                          palette.type === 'dark' ? 'rgb(66, 66, 66)' : '#fff',
                      }}
                      indentWidth={1}
                      displayDataTypes={false}
                      displayObjectSize={false}
                    />
                    <Button
                      variant="fab"
                      color="primary"
                      onClick={this.download}
                    >
                      <CloudDownload />
                    </Button>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
              </div>
            </Collapse>
            <Table trainings={training} view={id => view(id)} />
          </Grid>
          <Grid item xs={4}>
            <ProfileCard
              loading={false}
              subtitle="需要一些时间"
              agent="训练中"
              description="每次更新所选代理时，您都需要重新训练."
              avatar="https://s3.eu-west-2.amazonaws.com/rasatalk/813861_man_512x512.png"
            />
            <Card style={{ marginTop: '30px' }}>
              <CardHeader title="生成" subheader="使用此工具生成训练数据." />
              <CardContent>
                <TextField
                  select
                  helperText="请选择代理"
                  fullWidth
                  value={agentIndex}
                  onChange={this.handleChange('agent')}
                >
                  {agentStrings.map((agent, index) => (
                    <MenuItem key={agent} value={index}>
                      {agent}
                    </MenuItem>
                  ))}
                </TextField>
              </CardContent>
              <CardActions>
                <div style={{ position: 'relative' }}>
                  <Button
                    onClick={() => handleGetJSON(this.state.agent)}
                    disabled={!this.state.agent || loading}
                    variant="contained"
                    color="primary"
                  >
                    生成训练数据
                  </Button>
                  {loading && <StyledCP size={24} />}
                </div>
                {json.model !== undefined && (
                  <Tooltip id="tooltip-fab" title={`Agent: ${json.agent}`}>
                    <Button
                      onClick={() => dispatch(train(json.agent, json._id))}
                      variant="contained"
                      color="primary"
                    >
                      训练
                    </Button>
                  </Tooltip>
                )}
              </CardActions>
            </Card>
            <Card style={{ marginTop: '30px' }}>
              <CardHeader
                title="Rasa"
                subheader="White = Ready, Blue = currently training"
              />
              <CardContent>
                {inTraining && (
                  <TimerWrapper>
                    <span
                      style={{
                        color: palette.type === 'dark' ? '#fff' : '#000',
                      }}
                    >
                      目前正在训练
                    </span>
                    <Timer palette={palette} />
                  </TimerWrapper>
                )}
                <Status />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    );
  }
}

Training.propTypes = {
  agents: PropTypes.oneOfType([
    // The Agents
    PropTypes.array,
    PropTypes.object,
  ]),
  training: PropTypes.oneOfType([
    // The previous Trainings
    PropTypes.array,
    PropTypes.object,
  ]),
  theme: PropTypes.object, // The Theme
  json: PropTypes.object, // The current singular JSON
  loading: PropTypes.bool, // If we are loading something
  inTraining: PropTypes.bool, // If we are currently training the bot
  view: PropTypes.func.isRequired, // Method to get JSON from DB and display
  getAll: PropTypes.func.isRequired, // Called to get all previous trainings.
  dispatch: PropTypes.func.isRequired,
  getAgents: PropTypes.func.isRequired, // Method to get the agents to display in possible training options
  startWatch: PropTypes.func.isRequired, // Start polling for updates.
  changeTitle: PropTypes.func.isRequired, // Used to update the title in the app bar
  handleGetJSON: PropTypes.func.isRequired, // Method to get the create JSON for agent
};

const mapStateToProps = createStructuredSelector({
  json: selectJSON(),
  agents: selectAgents(),
  loading: selectLoading(),
  getting: selectGetting(),
  training: selectTraining(),
  inTraining: selectInTraining(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    getAll: () => dispatch(getAll()),
    view: id => dispatch(viewJSON(id)),
    getAgents: () => dispatch(getAgents()),
    startWatch: () => dispatch(startWatch()),
    handleGetJSON: agent => dispatch(getJSON(agent)),
    changeTitle: title => dispatch(changeTitle(title)),
  };
}

const withSaga = injectSaga({ key: 'training', saga });
const withReducer = injectReducer({ key: 'training', reducer });
const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);
const withPollSaga = injectSaga({ key: 'trainingPoll', saga: watcher });

export default compose(
  withReducer,
  withSaga,
  withPollSaga,
  withConnect,
  withTheme(),
)(Training);
