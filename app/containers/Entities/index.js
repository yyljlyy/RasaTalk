/**
 *
 * Entities
 *
 */

import React from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { push } from 'connected-react-router/immutable';
import injectSaga from 'utils/injectSaga';
import Wrapper from 'components/Grid/Wrapper';
import injectReducer from 'utils/injectReducer';
import { createStructuredSelector } from 'reselect';
import Synonyms from 'containers/Synonyms/Loadable';
import ProfileCard from 'components/Cards/ProfileCard';
import GenericTable from 'components/Table/GenericTable';

import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
} from '@material-ui/core';

import saga from './saga';
import reducer from './reducer';
import Link from '../../images/link.png';
import makeSelectEntities from './selectors';
import { changeTitle } from '../HomePage/actions';
import { addEntity, getEntities, removeEntities } from './actions';

export class Entities extends React.PureComponent {
  // eslint-disable-line react/prefer-stateless-function

  state = {
    newEntity: '',
  };

  componentDidMount() {
    this.props.changeTitle('Entities');
    this.props.getEntities();
  }

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      this.addEntity().then(() => {
        this.setState({ newEntity: '' }, () => this.textInput.focus());
      });
    }
  };

  addEntity = () =>
    new Promise(resolve => {
      this.props.addEntity(this.state.newEntity, resolve);
    });

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  render() {
    const {
      dispatch,
      all: { entities, addingEntity },
      remove,
      match: {
        params: { entity },
      },
    } = this.props;

    return (
      <div>
        <Helmet>
          <title>实体</title>
          <meta name="description" content="实体描述" />
        </Helmet>
        <Wrapper>
          <Grid item xs={8}>
            {entity && <Synonyms entity={entity} />}
            <GenericTable
              title="实体"
              items={entities}
              handleDelete={remove}
              headers={[
                {
                  id: 'name',
                  label: 'Entities',
                  cellClick: uid => dispatch(push(`/entities/${uid}`)),
                },
              ]}
            />
          </Grid>
          <Grid item xs={4}>
            <ProfileCard
              loading={false}
              agent="对话流程"
              description="实体表示与用户目的相关的一类对象或数据类型。 通过识别用户输入中提到的实体，本工具可以选择采取特定行动来实现意图."
              avatar={Link}
            />
            <Card style={{ marginTop: '30px' }}>
              <CardHeader
                title="添加新实体"
                subheader="随意使用您想使用的任何名称."
              />
              <CardContent>
                <TextField
                  id="newNode"
                  label="新实体"
                  value={this.state.newEntity}
                  onChange={this.handleChange('newEntity')}
                  onKeyPress={this.handleKeyPress}
                  inputRef={input => {
                    this.textInput = input;
                  }}
                  fullWidth
                  disabled={addingEntity}
                />
              </CardContent>
            </Card>
          </Grid>
        </Wrapper>
      </div>
    );
  }
}

Entities.propTypes = {
  all: PropTypes.object,
  match: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
  addEntity: PropTypes.func.isRequired,
  changeTitle: PropTypes.func.isRequired,
  getEntities: PropTypes.func.isRequired,
  remove: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  all: makeSelectEntities(),
});

function mapDispatchToProps(dispatch) {
  return {
    getEntities: () => {
      dispatch(getEntities());
    },
    addEntity: (entity, resolve) => {
      dispatch(addEntity(entity, resolve));
    },
    changeTitle: title => {
      dispatch(changeTitle(title));
    },
    remove: entities => {
      dispatch(removeEntities(entities));
    },
    dispatch,
  };
}

const withSaga = injectSaga({ key: 'entities', saga });
const withReducer = injectReducer({ key: 'entities', reducer });
const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(Entities);
