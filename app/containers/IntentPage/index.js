/**
 *
 * IntentPage
 *
 */

import React from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { push } from 'connected-react-router/immutable';
import Wrapper from 'components/Grid/Wrapper';
import BackButton from 'components/BackButton';
import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import { createStructuredSelector } from 'reselect';
import ProfileCard from 'components/Cards/ProfileCard';
import SnackBarContent from 'components/Snackbar/SnackbarContent';
import GenericTable from 'components/Table/GenericTable';
import {
  Grid,
  Card,
  Typography,
  CardContent,
  LinearProgress,
  FormControlLabel,
  TextField,
  Checkbox,
  IconButton,
} from '@material-ui/core';
import { Route } from 'react-router-dom';
import Expressions from 'containers/Expression/Loadable';
import { Edit } from '@material-ui/icons';
import EditAgent from './EditAgent';

import { selectAgent, updatingAgent } from '../Agents/selectors';
import { updateAgent, deleteAgent } from '../Agents/actions';

import saga from './saga';
import reducer from './reducer';
import { changeTitle } from '../HomePage/actions';
import { addIntent, removeIntents, getIntents } from './actions';
import makeSelectIntentPage from './selectors';

export class IntentPage extends React.PureComponent {
  // eslint-disable-line react/prefer-stateless-function

  state = {
    agent: this.props.match.params.agent,
    newIntent: '',
    addMultiple: false,
    open: false,
  };

  componentDidMount() {
    this.props.dispatch(changeTitle(`Agent: ${this.state.agent}`));
    this.props.dispatch(getIntents(this.props.match.params.agent));
  }

  handleOpen = () => this.setState({ open: true });
  handleClose = () => this.setState({ open: false });

  addIntent = () =>
    new Promise((resolve, reject) => {
      this.props.dispatch(
        addIntent(
          this.state.agent,
          this.state.newIntent,
          this.state.addMultiple,
          resolve,
          reject,
        ),
      );
    });

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      this.addIntent(this.state.newIntent).then(() => {
        this.setState({
          newIntent: '',
        });
      });
    }
  };

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleChangeCheckbox = name => event => {
    this.setState({ [name]: event.target.checked });
  };

  render() {
    const {
      dispatch,
      match,
      updating,
      intentPage: { intents, addingIntent, removingIntents, error },
      selectedAgent: { agent, avatar, subtitle, description },
    } = this.props;
    return (
      <React.Fragment>
        <Helmet>
          <title>IntentPage</title>
          <meta name="description" content="意图页面说明" />
        </Helmet>

        <EditAgent
          {...this.props.selectedAgent}
          updating={updating}
          open={this.state.open}
          handleClose={this.handleClose}
          onSubmit={(x, y) => dispatch(updateAgent(x, y))}
          onDelete={x => dispatch(deleteAgent(x))}
        />

        <Route
          path="/agents/:agent/intent/:intent"
          exact
          name="表达式"
          component={Expressions}
        />

        <Route
          path={match.path}
          exact
          name="对话流程"
          render={() => (
            <Wrapper>
              <BackButton tooltip="Back to agents" link="/agents" />

              <Grid item xs={8}>
                {removingIntents && <LinearProgress color="primary" />}
                <GenericTable
                  title="意图"
                  items={intents}
                  handleDelete={deleteIntents =>
                    dispatch(removeIntents(this.state.agent, deleteIntents))
                  }
                  headers={[
                    {
                      id: 'name',
                      label: '意图',
                      cellClick: route =>
                        dispatch(
                          push(
                            `/agents/${encodeURIComponent(
                              this.state.agent,
                            )}/intent/${encodeURIComponent(route)}`,
                          ),
                        ),
                    },
                  ]}
                />
              </Grid>
              <Grid item xs={4}>
                <ProfileCard
                  subtitle={subtitle}
                  agent={agent}
                  description={description}
                  avatar={avatar}
                  footer={
                    <IconButton onClick={this.handleOpen}>
                      <Edit />
                    </IconButton>
                  }
                />
                <Card>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      添加意图
                    </Typography>
                    <Typography component="p">
                      随意使用任何您喜欢的名称（带或不带前缀）
                    </Typography>

                    <TextField
                      id="newIntent"
                      label="新意图"
                      value={this.state.newIntent}
                      onChange={this.handleChange('newIntent')}
                      onKeyPress={this.handleKeyPress}
                      disabled={addingIntent}
                      inputRef={input => {
                        this.textInput = input;
                      }}
                      fullWidth
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={this.state.addMultiple}
                          onChange={this.handleChangeCheckbox('addMultiple')}
                          value="addMultiple"
                          color="primary"
                        />
                      }
                      label="添加多个"
                    />
                  </CardContent>
                </Card>

                {error && (
                  <div style={{ marginTop: '15px' }}>
                    <SnackBarContent message={error} color="danger" />
                  </div>
                )}
              </Grid>
            </Wrapper>
          )}
        />
      </React.Fragment>
    );
  }
}

IntentPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intentPage: PropTypes.object,
  match: PropTypes.object,
  selectedAgent: PropTypes.object,
  updating: PropTypes.bool,
};

function mapStateToProps(state, ownProps) {
  return createStructuredSelector({
    intentPage: makeSelectIntentPage(),
    selectedAgent: selectAgent(ownProps.match.params.agent),
    updating: updatingAgent(),
  });
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);
const withReducer = injectReducer({ key: 'intentPage', reducer });
const withSaga = injectSaga({ key: 'intentPage', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(IntentPage);
