/* eslint-disable no-nested-ternary */
/* eslint-disable indent */

/**
 *
 * EditNode
 *
 */

import React from 'react';
import { Map } from 'immutable';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';
import styled from 'styled-components';
import FlexRow from 'components/FlexRow';
import injectSaga from 'utils/injectSaga';
import Expansion from 'components/Expansion';
import injectReducer from 'utils/injectReducer';
import FlexCheckbox from 'components/FlexCheckbox';
import { createStructuredSelector } from 'reselect';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Checkbox, TextField } from 'redux-form-material-ui';
import { CloudDone, CloudOff } from '@material-ui/icons';
import {
  Button,
  Divider,
  Typography,
  CircularProgress,
  Tooltip,
} from '@material-ui/core';
import {
  arrayPush,
  Field,
  FieldArray,
  getFormValues,
  reduxForm,
} from 'redux-form/immutable';

import saga from './saga';
import reducer from './reducer';
import Webhook from './form/webhook';
import validate from './form/validate';
import { RenderSlots } from './form/slots';
import RenderResponse from './responses';
import QuickReplies from './form/quickReplies';
import makeSelectEditNode, { selectActive } from './selectors';
import { Body, Header, Wrapper } from './form/styles';
import { loadNode, saveNode } from './actions';
import { setEditNode } from '../SingleTalkFlow/actions';
import { selectHead } from '../SingleTalkFlow/selectors';

const ButtonSection = styled.div`
  margin: 15px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export class EditNode extends React.PureComponent {
  // eslint-disable-line react/prefer-stateless-function

  componentDidMount() {
    if (this.props.node) {
      this.props.dispatch(loadNode());
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.node !== this.props.node) {
      this.props.dispatch(loadNode());
    } else if (
      this.props.dirty &&
      this.props.valid &&
      !isEqual(this.props.values, prevProps.values)
    ) {
      // this.props.dispatch(saveNode());
    }
  }

  recognisesName(values) {
    if (values && values.recognises) {
      if (values.recognises.isJumpedTo) return 'Jumped To';
      if (values.recognises.regex) return `Regex: ${values.recognises.regex}`;
      if (values.recognises.condition)
        return `Condition: ${values.recognises.condition}`;
    }
    return '';
  }

  addSlot() {
    this.props.dispatch(arrayPush('EditNode', 'slots', Map({})));
  }
  render() {
    const {
      dispatch,
      values,
      handleSubmit,
      dirty,
      invalid,
      submitting,
      submitFailed,
      editnodetwo: { loading },
      headNode,
      node,
    } = this.props;
    const fv = values ? values.toJS() : {};
    const isParent = headNode === node;
    return (
      <Wrapper>
        <Header>
          <Typography variant="h6">{fv.name && `${fv.name.name}`}</Typography>
          {loading ? (
            <CircularProgress />
          ) : dirty ? (
            <CloudOff />
          ) : (
            <CloudDone />
          )}

          {fv.name && (
            <Tooltip id="tooltip-icon" title="Copy">
              <CopyToClipboard text={fv.name.uid}>
                <Typography variant="subtitle1" style={{ cursor: 'pointer' }}>
                  {fv.name && `${fv.name.uid}`}
                </Typography>
              </CopyToClipboard>
            </Tooltip>
          )}
        </Header>

        <Body>
          <form onSubmit={handleSubmit(() => dispatch(saveNode()))}>
            {/* Name */}
            <Expansion
              name="名称"
              subheading={fv.name && `${fv.name.name}`}
              help="节点的名称仅用于帮助识别它。 安全组可用于限制谁可以控制/查看它以及帮助组织他们."
            >
              <FlexRow>
                <Field
                  name="name.name"
                  component={TextField}
                  fullWidth
                  placeholder="Order Pizza"
                  label="名称"
                  type="text"
                />
                {isParent && (
                  <Field
                    name="name.group"
                    component={TextField}
                    fullWidth
                    placeholder="Food Group"
                    label="群组"
                    type="text"
                  />
                )}
              </FlexRow>
              <React.Fragment>
                <FlexCheckbox name="Node Enabled">
                  <Field name="enabled" component={Checkbox} label="启用" />
                </FlexCheckbox>
              </React.Fragment>
            </Expansion>

            {/* Recognises */}
            <Expansion
              name="Recognises"
              subheading={this.recognisesName(fv)}
              help="触发该节点的方式."
            >
              <React.Fragment>
                <FlexRow>
                  {(!fv.recognises ||
                    (!fv.recognises.isJumpedTo && !fv.recognises.regex)) && (
                    <Field
                      name="recognises.condition"
                      component={TextField}
                      fullWidth
                      placeholder="#order_pizza"
                      label="认可"
                      type="text"
                    />
                  )}
                  {(!fv.recognises ||
                    (!fv.recognises.isJumpedTo &&
                      !fv.recognises.condition)) && (
                    <Field
                      name="recognises.regex"
                      component={TextField}
                      fullWidth
                      placeholder="^\[order_pizza]+\$"
                      label="正则表达式"
                      type="text"
                    />
                  )}
                  {fv.recognises &&
                    (!fv.recognises.isJumpedTo && fv.recognises.regex) && (
                      <Field
                        name="recognises.regexFlags"
                        component={TextField}
                        fullWidth
                        placeholder="gi"
                        label="正则表达式标志"
                        type="text"
                      />
                    )}
                </FlexRow>
              </React.Fragment>
              <React.Fragment>
                <FlexCheckbox name="Is Jumped To">
                  <Field
                    name="recognises.isJumpedTo"
                    component={Checkbox}
                    label="跳到"
                  />
                </FlexCheckbox>
              </React.Fragment>
            </Expansion>

            {/* Slots */}
            <Expansion name="槽位" help="使用槽位解析对话.">
              <React.Fragment>
                <FlexRow style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                  <FieldArray name="slots" component={RenderSlots} />
                </FlexRow>
              </React.Fragment>
              <React.Fragment>
                <Button onClick={() => this.addSlot()}>Add Slot</Button>
              </React.Fragment>
            </Expansion>

            {/* Responses */}
            <Expansion
              name="回复"
              help="这就是发送回用户的内容。 如果建议使用自定义实现markdown"
            >
              <React.Fragment>
                <FlexRow style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                  <FieldArray name="responses" component={RenderResponse} />
                </FlexRow>
              </React.Fragment>
              <React.Fragment>
                <Button
                  onClick={() =>
                    dispatch(
                      arrayPush(
                        'EditNode',
                        'responses',
                        Map({ output: [null] }),
                      ),
                    )
                  }
                >
                  Add Response
                </Button>
              </React.Fragment>
            </Expansion>

            {/* Quick Replies */}
            <Expansion
              name="快速回复 (Buttons)"
              style={{ flexBasis: '50%' }}
              help="这些可以格式化为按钮，用户可以按这些按钮。提供URL可用于将按钮链接到文本按钮."
            >
              <React.Fragment>
                <FlexRow style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                  <FieldArray name="quick_replies" component={QuickReplies} />
                </FlexRow>
              </React.Fragment>
              <React.Fragment>
                <Button
                  onClick={() =>
                    dispatch(arrayPush('EditNode', 'quick_replies', Map({})))
                  }
                >
                  添加快速回复
                </Button>
              </React.Fragment>
            </Expansion>

            {/* Jump To */}
            <Expansion
              name="跳转"
              help="如果希望节点自动移动到另一个节点，请将其ID粘贴到下面。"
            >
              <React.Fragment>
                <FlexRow>
                  <Field
                    name="jump.to"
                    component={TextField}
                    fullWidth
                    placeholder="SW47UY"
                    label="跳转"
                    type="text"
                  />
                  <Field
                    name="jump.condition"
                    component={TextField}
                    fullWidth
                    placeholder="Date.now() < 12.00.00"
                    label="条件"
                    type="text"
                  />
                </FlexRow>
              </React.Fragment>
              <React.Fragment />
            </Expansion>

            {/* Save */}
            <Expansion
              name="保存"
              help="这允许您收集用户响应并在以后的聊天中使用它."
            >
              <React.Fragment>
                <FlexRow>
                  <Field
                    name="save.name"
                    component={TextField}
                    fullWidth
                    placeholder="[userChoice]"
                    label="保存名称"
                    type="text"
                  />
                  <Field
                    name="save.condition"
                    component={TextField}
                    fullWidth
                    placeholder="Date.now() < 12 || [pizzaType] !== 'pep'"
                    label="条件"
                    type="text"
                  />
                </FlexRow>
              </React.Fragment>
              <React.Fragment />
            </Expansion>

            {/* Webhooks */}
            <Expansion
              name="Webhooks"
              help="Webhooks允许您使用任何API，但是在实现套接字之前，它们可以将用户的响应放入槽中."
            >
              <React.Fragment>
                <div style={{ width: '100%' }}>
                  <FlexRow>
                    <Field
                      name="webhook.to"
                      component={TextField}
                      fullWidth
                      label="URL"
                      placeholder="https://api..."
                    />
                    <Field
                      name="webhook.type"
                      component={TextField}
                      fullWidth
                      label="方法"
                      placeholder="GET"
                    />
                    <Field
                      name="webhook.body"
                      component={TextField}
                      fullWidth
                      label="Body"
                      placeholder={'{data: "whatever"}'}
                    />
                  </FlexRow>

                  <FlexRow>
                    <Field
                      name="webhook.success"
                      component={TextField}
                      fullWidth
                      label="跳转成功"
                      placeholder="GL60QB"
                    />
                    <Field
                      name="webhook.failure"
                      component={TextField}
                      fullWidth
                      label="跳转失败"
                      placeholder="OX41XU"
                    />
                  </FlexRow>

                  {fv.webhook &&
                    fv.webhook.save && (
                      <React.Fragment>
                        <Divider style={{ margin: '25px 0' }} />
                        <Typography>Save Response</Typography>
                        <FlexRow>
                          <FieldArray
                            name="webhook.variables"
                            component={Webhook}
                          />
                        </FlexRow>
                      </React.Fragment>
                    )}
                </div>
              </React.Fragment>
              <React.Fragment>
                <React.Fragment>
                  <FlexCheckbox name="Webhook Enabled">
                    <Field
                      name="webhook.enabled"
                      component={Checkbox}
                      label="开启"
                    />
                  </FlexCheckbox>
                </React.Fragment>
                <FlexCheckbox name="Save Response">
                  <Field
                    name="webhook.save"
                    component={Checkbox}
                    label="保存响应"
                  />
                  {fv.webhook &&
                    fv.webhook.save && (
                      <Button
                        onClick={() =>
                          dispatch(
                            arrayPush('EditNode', 'webhook.variables', Map({})),
                          )
                        }
                      >
                        Add Webhook Save
                      </Button>
                    )}
                </FlexCheckbox>
              </React.Fragment>
            </Expansion>
            <ButtonSection>
              {dirty && (
                <Button
                  type="submit"
                  variant="outlined"
                  disabled={(invalid && submitFailed) || submitting}
                  size="small"
                >
                  保存
                </Button>
              )}
              {submitFailed &&
                invalid && (
                  <Typography
                    style={{ color: 'red', marginLeft: '10px' }}
                    size="small"
                  >
                    请修复表单错误.
                  </Typography>
                )}
              <Button
                onClick={() => dispatch(setEditNode(''))}
                variant="outlined"
                size="small"
                style={{ marginLeft: 'auto' }}
              >
                关闭
              </Button>
            </ButtonSection>
          </form>
        </Body>
        {/* <pre>{JSON.stringify(values, ' ', 2)}</pre> */}
      </Wrapper>
    );
  }
}

EditNode.propTypes = {
  dispatch: PropTypes.func.isRequired,
  node: PropTypes.string,
  headNode: PropTypes.string,
  values: PropTypes.object,
  editnodetwo: PropTypes.object,
  handleSubmit: PropTypes.func,
  dirty: PropTypes.bool,
  valid: PropTypes.bool,
  invalid: PropTypes.bool,
  submitting: PropTypes.bool,
  submitFailed: PropTypes.bool,
};

const mapStateToProps = createStructuredSelector({
  editnodetwo: makeSelectEditNode(),
  values: getFormValues('EditNode'),
  isActive: selectActive(),
  headNode: selectHead(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

const withForm = reduxForm({ form: 'EditNode', validate });
const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);
const withReducer = injectReducer({ key: 'editNode', reducer });
const withSaga = injectSaga({ key: 'editNode', saga });

export default compose(
  withReducer,
  withSaga,
  withForm,
  withConnect,
)(EditNode);
